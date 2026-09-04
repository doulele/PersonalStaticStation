<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">能力测评报告</h1>
      <span v-if="report && report.finishedAt" class="page-sub">{{ fmtTime(report.finishedAt) }}</span>
    </div>

    <template v-if="loading">
      <div class="cp-loading">报告加载中…</div>
    </template>
    <template v-else-if="!report">
      <el-empty description="报告不存在或已被清理">
        <el-button type="primary" @click="$router.push('/study/comprehension/assessment')">重新测评</el-button>
      </el-empty>
    </template>
    <template v-else>
      <!-- 摘要 -->
      <section class="cp-summary" :class="{ first: report.isFirst }">
        <div class="cp-summary-score">
          <b>{{ indexScore }}</b>
          <span>理解力指数</span>
        </div>
        <div class="cp-summary-body">
          <h3>{{ report.isFirst ? '第一次测评完成 🎉' : '本次测评完成' }}</h3>
          <p class="cp-summary-ai">{{ report.summary || 'AI 正在梳理你的能力画像…' }}</p>
          <p v-if="report.cushion" class="cp-summary-cushion">{{ report.cushion }}</p>
        </div>
      </section>

      <!-- 雷达 + 等级 -->
      <section class="cp-report-grid">
        <div class="cp-panel">
          <h4 class="cp-panel-title">能力雷达</h4>
          <div ref="radarEl" class="cp-radar"></div>
        </div>
        <div class="cp-panel">
          <h4 class="cp-panel-title">四维等级</h4>
          <div v-for="d in dimRows" :key="d.id" class="cp-lv-row" :style="{ '--dim-c': d.color }">
            <span class="cp-lv-icon">{{ d.icon }}</span>
            <div class="cp-lv-main">
              <div class="cp-lv-line">
                <b>{{ d.id }} {{ d.name }}</b>
                <span class="cp-lv-num" :class="lvTone(d.level)">L{{ d.level }}</span>
                <span class="cp-lv-delta" v-if="deltaOf(d.id) != null" :class="deltaOf(d.id) > 0 ? 'up' : (deltaOf(d.id) < 0 ? 'down' : 'eq')">
                  {{ deltaOf(d.id) > 0 ? '↑' : deltaOf(d.id) < 0 ? '↓' : '—' }}{{ Math.abs(deltaOf(d.id)) }}
                </span>
              </div>
              <div class="cp-lv-track"><i :style="{ width: (d.level / 5) * 100 + '%', background: d.color }"></i></div>
            </div>
            <span class="cp-lv-stab" :class="d.tag">{{ d.label }}</span>
          </div>
          <div class="cp-panel-note">
            <template v-if="report.dimsAllStable">🎉 四个维度均已达到稳定状态，可以放心进入下一级挑战。</template>
            <template v-else>维度「稳定」需在当前层级累计通过 3 次训练，用于确认升阶而非偶然发挥。</template>
          </div>
        </div>
      </section>

      <!-- 最短板推荐 -->
      <section class="cp-reco" v-if="report.startRecommend">
        <div class="cp-reco-icon">🎯</div>
        <div class="cp-reco-body">
          <b>建议从最短短板开始</b>
          <p>{{ report.startRecommend.text }}</p>
        </div>
        <el-button type="primary" class="cp-btn-main" @click="$router.push('/study/comprehension/training')">去今日训练</el-button>
      </section>

      <!-- 错误模式 -->
      <section v-if="wrongRows.length" class="cp-panel">
        <h4 class="cp-panel-title">错误模式分析</h4>
        <div class="cp-wrong-grid">
          <div v-for="w in wrongRows" :key="w.key" class="cp-wrong-card">
            <div class="cp-wrong-head">
              <span class="cp-wrong-dim">{{ w.key }} · {{ w.dimName }}</span>
              <span class="cp-wrong-rate">{{ w.rate }}% 答错率</span>
            </div>
            <b class="cp-wrong-title">{{ w.title }}</b>
            <p class="cp-wrong-advice">💡 {{ w.advice }}</p>
          </div>
        </div>
      </section>

      <!-- AI 深度解读 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">
          AI 深度解读
          <span v-if="quotaText" class="cp-quota">{{ quotaText }}</span>
        </h4>
        <p v-if="!deepText" class="cp-ai-empty">
          想让 AI 结合你的作答，给出更具体的能力拆解与下一步行动建议？
        </p>
        <div v-if="deepText" class="cp-ai-text">{{ deepText }}</div>
        <div class="cp-ai-actions">
          <el-button type="primary" plain :loading="aiBusy" @click="askDeep">{{ deepText ? '换一种角度再解读' : '生成深度解读' }}</el-button>
          <span class="cp-ai-note">AI 解读每日可使用 5 次</span>
        </div>
      </section>

      <!-- 对比上次 -->
      <section v-if="prevReport && prevReport.dims" class="cp-panel">
        <h4 class="cp-panel-title">与上次测评对比</h4>
        <div class="cp-cmp-grid">
          <div v-for="d in DIM_META" :key="d.id" class="cp-cmp-col">
            <span class="cp-cmp-dim" :style="{ color: d.color }">{{ d.id }}</span>
            <div class="cp-cmp-lv">
              <span class="cp-cmp-old">L{{ (prevReport.dims[d.id] || {}).level ?? 0 }}</span>
              <el-icon class="cp-cmp-arrow"><ArrowRight /></el-icon>
              <span class="cp-cmp-new">L{{ (report.dims[d.id] || {}).level ?? 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cp-cta">
        <h3>报告只是地图，训练才是脚步</h3>
        <p>每天 3 分钟的组合训练，让能力在刻意练习中变成习惯。</p>
        <div class="cp-cta-btns">
          <el-button type="primary" class="cp-btn-main" @click="$router.push('/study/comprehension/training')">开始每日训练</el-button>
          <el-button @click="$router.push('/study/comprehension')">回到总览</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getReport, deepAi } from '@/api/comprehension'
import { DIM_META } from './cp-meta'

const route = useRoute()
const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const loading = ref(true)
const report = ref(null)
const prevReport = ref(null)
const radarEl = ref(null)
let chart = null

const indexScore = computed(() => {
  if (!report.value) return 0
  const sum = DIM_META.reduce((s, d) => s + ((report.value.dims[d.id] || {}).level || 0), 0)
  return Math.round((sum / 20) * 100)
})
const dimRows = computed(() => DIM_META.map((m) => {
  const v = (report.value.dims || {})[m.id] || {}
  return { ...m, level: v.level || 0, stableCount: v.stableCount || 0, tag: v.tag || 'unstable', label: v.label || '未激活', text: v.text || '' }
}))
const wrongRows = computed(() => Object.entries(report.value.wrongs || {}).map(([key, w]) => ({ key, ...w })))

function deltaOf(id) {
  if (!prevReport.value || !prevReport.value.dims) return null
  const old = (prevReport.value.dims[id] || {}).level
  const now = (report.value.dims[id] || {}).level
  if (old === undefined) return null
  return now - old
}
function lvTone(lv) {
  if (lv >= 4) return 'high'
  if (lv >= 2) return 'mid'
  return 'low'
}
function fmtTime(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/* AI 深度 */
const deepText = ref('')
const aiBusy = ref(false)
const quotaText = ref('')
async function askDeep() {
  aiBusy.value = true
  try {
    const res = await deepAi('report', { assessId: report.value.assessId })
    if (!res.success) throw new Error(res.error || '生成失败')
    deepText.value = res.data.text || '（本次未生成内容，请稍后重试）'
    if (typeof res.data.left === 'number') quotaText.value = `剩余 ${res.data.left} 次`
  } catch (e) {
    console.error(e)
  } finally {
    aiBusy.value = false
  }
}

/** 读取 CSS 变量实际色值（echarts canvas 不解析 var()） */
function cv(name, fallback = '') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
let themeObserver = null

function renderRadar() {
  if (!chart && radarEl.value) chart = echarts.init(radarEl.value)
  if (!chart) return
  const radar = report.value.radar || DIM_META.map((m) => ({ name: m.name, value: (report.value.dims[m.id] || {}).level || 0 }))
  const accent = cv('--cp-accent', '#6d5dfc')
  chart.setOption({
    tooltip: {
      backgroundColor: cv('--cp-card', '#fff'),
      borderColor: cv('--cp-line', '#e2e8f0'),
      textStyle: { color: cv('--cp-ink', '#303133') }
    },
    radar: {
      indicator: DIM_META.map((m) => ({ name: m.name, max: 5 })),
      radius: '64%',
      splitNumber: 5,
      axisName: { color: cv('--cp-sub', '#7d7a96'), fontSize: 12, fontWeight: 600 },
      splitArea: { areaStyle: { color: [cv('--cp-card-2', '#f8f7ff'), cv('--cp-accent-softer', 'rgba(109,93,252,0.06)')] } },
      splitLine: { lineStyle: { color: cv('--cp-line', '#e2e8f0') } },
      axisLine: { lineStyle: { color: cv('--cp-line', '#e2e8f0') } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radar.map((r) => r.value),
        name: '当前水平',
        areaStyle: { color: accent + '40' },
        lineStyle: { color: accent, width: 2 },
        itemStyle: { color: accent }
      }]
    }]
  })
}

const onResize = () => chart && chart.resize()

onMounted(async () => {
  try {
    const res = await getReport(route.params.id)
    if (res.success) {
      report.value = res.data.report || null
      prevReport.value = res.data.prevReport || null
      if (report.value) {
        await nextTick()
        renderRadar()
        window.addEventListener('resize', onResize)
        // 主题切换（html.dark-mode class 变化）时按新配色重绘
        themeObserver = new MutationObserver(() => { renderRadar() })
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      }
    }
  } finally {
    loading.value = false
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

.cp-summary { display: flex; gap: 22px; align-items: center; background: var(--cp-grad); border-radius: 18px; padding: 24px 26px; color: #fff; margin-bottom: 18px;
  &.first { background: linear-gradient(135deg, #6d5dfc, #ec4899 130%); }
  .cp-summary-score { flex: none; width: 108px; height: 108px; border-radius: 50%; background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center;
    b { font-size: 32px; }
    span { font-size: 11.5px; opacity: 0.9; } }
  .cp-summary-body { flex: 1;
    h3 { margin: 0 0 8px; font-size: 19px; }
    .cp-summary-ai { margin: 0 0 8px; font-size: 14px; line-height: 1.8; opacity: 0.96; white-space: pre-wrap; }
    .cp-summary-cushion { margin: 0; font-size: 12.5px; opacity: 0.85; line-height: 1.7; border-left: 2px solid rgba(255,255,255,.5); padding-left: 10px; }
  }
}

.cp-report-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16px; margin-bottom: 16px;
  @media (max-width: 820px) { grid-template-columns: 1fr; }
}
.cp-panel { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 18px 20px; box-shadow: var(--cp-shadow); margin-bottom: 16px; }
.cp-panel-title { display: flex; align-items: center; justify-content: space-between; margin: 0 0 14px; font-size: 15px;
  .cp-quota { font-size: 11.5px; font-weight: 500; color: var(--cp-sub); background: var(--cp-card-2); padding: 2px 10px; border-radius: 999px; }
}
.cp-radar { width: 100%; height: 300px; }

.cp-lv-row { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--cp-line);
  &:last-of-type { border-bottom: none; }
  .cp-lv-icon { width: 30px; height: 30px; flex: none; border-radius: 8px; background: var(--cp-accent-softer); color: var(--dim-c); display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
  .cp-lv-main { flex: 1;
    .cp-lv-line { display: flex; align-items: center; gap: 8px;
      b { font-size: 13.5px; }
      .cp-lv-num { font-weight: 800; font-size: 13px;
        &.high { color: var(--cp-d4); } &.mid { color: var(--cp-d2); } &.low { color: var(--cp-sub); } }
      .cp-lv-delta { font-size: 11px; font-weight: 700;
        &.up { color: var(--cp-ok); } &.down { color: var(--cp-bad); } &.eq { color: var(--cp-sub); } }
    }
    .cp-lv-track { height: 6px; border-radius: 4px; background: var(--cp-card-2); margin-top: 5px;
      i { display: block; height: 100%; border-radius: 4px; } }
  }
  .cp-lv-stab { flex: none; font-size: 11px; padding: 2px 9px; border-radius: 999px;
    &.stable { background: rgba(16,185,129,.14); color: var(--cp-ok); }
    &.basic { background: rgba(245,158,11,.15); color: var(--cp-warn); }
    &.unstable { background: rgba(239,68,68,.12); color: var(--cp-bad); }
  }
}
.cp-panel-note { margin-top: 12px; font-size: 12.5px; color: var(--cp-sub); line-height: 1.7; background: var(--cp-card-2); border-radius: 10px; padding: 10px 12px; }

.cp-reco { display: flex; align-items: center; gap: 16px; background: linear-gradient(90deg, rgba(109,93,252,.1), rgba(109,93,252,.04)); border: 1px solid var(--cp-line); border-radius: 16px; padding: 18px 20px; margin-bottom: 16px;
  .cp-reco-icon { font-size: 30px; flex: none; }
  .cp-reco-body { flex: 1;
    b { font-size: 15px; }
    p { margin: 4px 0 0; font-size: 13.5px; color: var(--cp-sub); line-height: 1.7; } }
}

.cp-wrong-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
.cp-wrong-card { border: 1px solid var(--cp-line); border-radius: 12px; padding: 14px 16px; background: var(--cp-card-2);
  .cp-wrong-head { display: flex; justify-content: space-between; font-size: 12px; color: var(--cp-sub); margin-bottom: 6px; }
  .cp-wrong-title { font-size: 14px; }
  .cp-wrong-advice { margin: 8px 0 0; font-size: 13px; line-height: 1.7; color: var(--cp-sub); }
}

.cp-ai-empty { color: var(--cp-sub); font-size: 13.5px; line-height: 1.8; margin: 0 0 12px; }
.cp-ai-text { white-space: pre-wrap; line-height: 1.9; font-size: 14px; background: var(--cp-card-2); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; border-left: 3px solid var(--cp-accent); }
.cp-ai-actions { display: flex; align-items: center; gap: 12px; }
.cp-ai-note { font-size: 12px; color: var(--cp-sub); }

.cp-cmp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
.cp-cmp-col { text-align: center; background: var(--cp-card-2); border: 1px solid var(--cp-line); border-radius: 12px; padding: 12px;
  .cp-cmp-dim { font-weight: 800; font-size: 15px; }
  .cp-cmp-lv { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px; font-size: 14px;
    .cp-cmp-old { color: var(--cp-sub); }
    .cp-cmp-arrow { color: var(--cp-line); }
    .cp-cmp-new { font-weight: 800; color: var(--cp-accent-strong); } }
}

.cp-cta { text-align: center; background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 26px; margin-top: 8px;
  h3 { margin: 0 0 6px; font-size: 18px; }
  p { margin: 0 0 16px; color: var(--cp-sub); font-size: 13.5px; }
}

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-summary { padding: 20px 18px; }
  .cp-panel { padding: 16px; }
  .cp-radar { height: 260px; }
  .cp-cta { padding: 22px 16px; }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-summary { flex-direction: column; gap: 14px; text-align: center; }
  .cp-wrong-grid { grid-template-columns: 1fr; }
  .cp-reco { flex-direction: column; align-items: flex-start; gap: 10px;
    .cp-btn-main { width: 100%; } }
  .cp-ai-actions { flex-direction: column; align-items: flex-start; gap: 8px; }
  .cp-cta-btns { display: flex; flex-direction: column; gap: 10px;
    .el-button { margin-left: 0; } }
}
</style>

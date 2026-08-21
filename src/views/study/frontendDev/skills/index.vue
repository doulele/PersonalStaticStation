<template>
  <div class="skills-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">技能雷达</h1>
    </div>

    <!-- 雷达图 -->
    <div class="panel">
      <h2 class="panel-title">能力分布</h2>
      <div ref="radarRef" class="chart radar-chart"></div>
    </div>

    <!-- 成长曲线 -->
    <div class="panel">
      <div class="panel-head">
        <h2 class="panel-title">能力成长曲线</h2>
        <el-radio-group v-model="range" size="small" @change="loadGrowth">
          <el-radio-button value="week">近 7 天</el-radio-button>
          <el-radio-button value="month">近 30 天</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="growthRef" class="chart growth-chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import * as echarts from 'echarts'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getRadar, getGrowth } from '@/api/knowledgeGraph'
import { CATEGORIES } from '../data/categories'

const router = useRouter()
const store = useStore()

const radarRef = ref(null)
const growthRef = ref(null)
const range = ref('week')
let radarChart = null
let growthChart = null

function isDark() { return store.getters.isDark }

async function loadRadar() {
  const res = await getRadar()
  if (!res.success || !radarRef.value) return
  const data = res.data || {}

  const indicator = CATEGORIES.map(c => ({ name: c.name, max: 100 }))
  const values = CATEGORIES.map(c => data[c.id]?.percent || 0)

  if (!radarChart) radarChart = echarts.init(radarRef.value)
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator,
      radius: '65%',
      axisName: { color: isDark() ? '#94a3b8' : '#475569', fontSize: 12 },
      splitArea: { areaStyle: { color: isDark() ? ['#1e1e2e', '#232338'] : ['#fff', '#f8fafc'] } },
      splitLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } },
      axisLine: { lineStyle: { color: isDark() ? '#2d2d4a' : '#e2e8f0' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: '能力分布',
        areaStyle: { color: 'rgba(99, 102, 241, 0.3)' },
        lineStyle: { color: '#6366f1', width: 2 },
        itemStyle: { color: '#8b5cf6' }
      }]
    }]
  }, true)
}

async function loadGrowth() {
  const res = await getGrowth(range.value)
  if (!res.success || !growthRef.value) return
  const data = res.data || []

  if (!growthChart) growthChart = echarts.init(growthRef.value)
  growthChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['点亮节点', '答题数'], textStyle: { color: isDark() ? '#94a3b8' : '#475569' } },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
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
}

function handleResize() {
  radarChart?.resize()
  growthChart?.resize()
}

function goBack() {
  router.push('/study/frontend-dev')
}

onMounted(async () => {
  await nextTick()
  await loadRadar()
  await loadGrowth()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  growthChart?.dispose()
})
</script>

<style lang="scss" scoped>
.skills-page {
  padding: 32px 24px 60px;
  max-width: 960px;
  margin: 0 auto;
}

.page-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 16px;
}

.panel-head .panel-title {
  margin: 0;
}

.chart {
  width: 100%;
}

.radar-chart {
  height: 460px;
}

.growth-chart {
  height: 320px;
}

@media (max-width: 768px) {
  .radar-chart { height: 360px; }
}
</style>

<style lang="scss">
html.dark-mode .skills-page {
  .page-title { color: #e2dee9; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .panel { background: #1e1e2e; border-color: #2d2d4a; }
  .panel-title { color: #e2dee9; }
}
</style>

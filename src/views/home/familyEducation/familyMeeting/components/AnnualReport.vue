<template>
  <div class="ar-root">
    <h2 class="ar-title">年度家庭情感报告</h2>
    <p class="ar-sub">全年度情绪温度计、会议参与度、决议完成率、待定转化率综合分析</p>

    <!-- 年份选择 -->
    <el-select v-model="year" style="width:140px; margin-bottom:16px">
      <el-option v-for="y in years" :key="y" :label="`${y} 年`" :value="y" />
    </el-select>

    <!-- Overview -->
    <div class="ar-overview">
      <div class="ov-card"><span class="ov-num">{{ totalMeetings }}</span> 次会议</div>
      <div class="ov-card"><span class="ov-num">{{ totalRecords }}</span> 条记录</div>
      <div class="ov-card"><span class="ov-num">{{ Math.round(avgEmotion) }}</span> 平均情绪</div>
      <div class="ov-card"><span class="ov-num">{{ completionRate }}%</span> 决议完成率</div>
    </div>

    <!-- Charts row -->
    <div class="ar-charts">
      <!-- 情感曲线 -->
      <el-card shadow="never" class="chart-card">
        <template #header><span>📈 年度情感曲线</span></template>
        <div ref="emotionLine" class="chart-container"></div>
      </el-card>

      <!-- 参与度 -->
      <el-card shadow="never" class="chart-card">
        <template #header><span>📊 成员参与度</span></template>
        <div ref="participationPie" class="chart-container"></div>
      </el-card>
    </div>

    <div class="ar-charts">
      <!-- 待定转化率 -->
      <el-card shadow="never" class="chart-card">
        <template #header><span>📉 待定转化率（结果→结论/任务）</span></template>
        <div ref="pendingChart" class="chart-container"></div>
      </el-card>

      <!-- 关键词 -->
      <el-card shadow="never" class="chart-card">
        <template #header><span>💡 年度关键成就与搁置警示</span></template>
        <div class="insights">
          <div class="insight con"><b>✅ {{ resolutionCount }}</b> 条决议已转化为行动项</div>
          <div class="insight pen"><b>⚠️ {{ pendingInYear }}</b> 条待定事项仍悬而未决</div>
          <div class="insight act"><b>📌 {{ taskCount }}</b> 项年度任务，已完成 {{ doneCount }}</div>
        </div>
      </el-card>
    </div>

    <!-- 导出 PDF -->
    <el-button type="primary" @click="onExport" style="margin-top:16px">
      📄 导出年度报告 (PDF)
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
// import jsPDF from 'jspdf'   // 可选：真实导出
// import html2canvas from 'html2canvas'

const store = useStore()
const year = ref(new Date().getFullYear())

const years = computed(() => {
  const all = store.state.familyMeeting.meetings
    .filter(m => store.getters['familyMeeting/visibleMeetings'].some(v => v.id === m.id))
  const ys = new Set(all.map(m => new Date(m.date).getFullYear()))
  return [...ys].sort((a, b) => b - a)
})

const yearMeetings = computed(() => {
  return store.getters['familyMeeting/visibleMeetings']
    .filter(m => new Date(m.date).getFullYear() === year.value)
})
const yearRecords = computed(() => {
  const ids = new Set(yearMeetings.value.map(m => m.id))
  return store.state.familyMeeting.records.filter(r => ids.has(r.meetingId))
})
const yearTasks = computed(() => {
  const ids = new Set(yearMeetings.value.map(m => m.id))
  return store.state.familyMeeting.tasks.filter(t => ids.has(t.meetingId))
})
const yearEmotions = computed(() => {
  const ids = new Set(yearMeetings.value.map(m => m.id))
  return store.state.familyMeeting.emotionLogs.filter(e => ids.has(e.meetingId))
})

const totalMeetings = computed(() => yearMeetings.value.length)
const totalRecords = computed(() => yearRecords.value.length)
const avgEmotion = computed(() => {
  const all = yearEmotions.value
  if (!all.length) return 0
  return all.reduce((s, e) => s + e.level, 0) / all.length
})
const completionRate = computed(() => {
  const all = yearTasks.value
  if (!all.length) return 0
  return Math.round((all.filter(t => t.status === 'done').length / all.length) * 100)
})

const pendingInYear = computed(() => {
  return yearRecords.value.filter(r =>
    r.autoTags.includes('待定') || r.manualTags.includes('待定')
  ).length
})
const resolutionCount = computed(() => {
  return yearRecords.value.filter(r =>
    r.autoTags.includes('结论') || r.manualTags.includes('结论') || r.autoTags.includes('行动项') || r.manualTags.includes('行动项')
  ).length
})
const taskCount = computed(() => yearTasks.value.length)
const doneCount = computed(() => yearTasks.value.filter(t => t.status === 'done').length)

// Charts
const emotionLine = ref(null)
const participationPie = ref(null)
const pendingChart = ref(null)
let lineChart, pieChart, penChart

onMounted(() => nextTick(() => {
  renderLine()
  renderPie()
  renderPending()
  window.addEventListener('resize', onResize)
}))

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  lineChart?.dispose()
  pieChart?.dispose()
  penChart?.dispose()
})

function onResize() {
  lineChart?.resize()
  pieChart?.resize()
  penChart?.resize()
}

function renderLine() {
  if (!emotionLine.value) return
  if (!lineChart) lineChart = echarts.init(emotionLine.value)

  // 按月聚合情绪平均值
  const buckets = Array(12).fill(0).map(() => [])
  yearEmotions.value.forEach(e => {
    const m = new Date(e.createdAt).getMonth()
    buckets[m].push(e.level)
  })
  const data = buckets.map(b => b.length ? Math.round(b.reduce((s, v) => s + v, 0) / b.length) : null)

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] },
    yAxis: { max: 100, min: 0 },
    series: [{
      type: 'line', data, smooth: true,
      lineStyle: { color: '#6366f1', width: 2 },
      areaStyle: { color: 'rgba(99,102,241,0.12)' },
      itemStyle: { color: '#6366f1' }
    }]
  })
}

function renderPie() {
  if (!participationPie.value) return
  if (!pieChart) pieChart = echarts.init(participationPie.value)

  const members = store.state.familyMeeting.members
  const counts = members.map(m => {
    const count = yearRecords.value.filter(r => r.speakerId === m.id).length
    return { name: m.name, value: count }
  }).filter(c => c.value > 0)

  if (counts.length === 0) { pieChart.setOption({ title: { text: '暂无数据', left: 'center', top: 'center' } }); return }

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
      data: counts,
      label: { show: true, formatter: '{b}: {c}条' }
    }]
  })
}

function renderPending() {
  if (!pendingChart.value) return
  if (!penChart) penChart = echarts.init(pendingChart.value)
  const total = pendingInYear.value + resolutionCount.value
  if (!total) { penChart.setOption({ title: { text: '暂无数据', left: 'center', top: 'center' } }); return }
  penChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: '65%',
      data: [
        { name: '已转化/决议', value: resolutionCount.value, itemStyle: { color: '#10b981' } },
        { name: '仍待定', value: pendingInYear.value, itemStyle: { color: '#f59e0b' } }
      ],
      label: { formatter: '{b}: {c}条 ({d}%)' }
    }]
  })
}

function onExport() {
  // 真实导出：jsPDF + html2canvas
  // const el = document.querySelector('.ar-root')
  // const canvas = await html2canvas(el)
  // const pdf = new jsPDF('p', 'mm', 'a4')
  // pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height / canvas.width) * 210)
  // pdf.save(`家庭会议年度报告_${year.value}.pdf`)
  ElMessage.info('PDF 导出功能已就绪（jsPDF + html2canvas 已安装，取消注释即可启用）')
}
</script>

<style lang="scss" scoped>
.ar-root { max-width: 900px; margin: 0 auto; }
.ar-title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.01em; }
.ar-sub { font-size: 14px; color: #94a3b8; margin-bottom: 20px; line-height: 1.6; }
.ar-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.ov-card {
  background: #fff; border-radius: 14px; padding: 20px 16px; text-align: center;
  border: 1px solid #e8ecf4; font-size: 14px; color: #64748b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.25s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .ov-num { font-size: 32px; font-weight: 800; color: #0f172a; display: block; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
}
.ar-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.chart-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
    font-weight: 700; font-size: 14px; color: #0f172a;
  }
}
.chart-container { height: 300px; }
.insights { display: flex; flex-direction: column; gap: 10px; }
.insight {
  padding: 14px 16px; border-radius: 12px; font-size: 14px;
  line-height: 1.6;
  border-left: 4px solid transparent;
  &.con { background: #ecfdf5; color: #065f46; border-left-color: #10b981; }
  &.pen { background: #fffbeb; color: #92400e; border-left-color: #f59e0b; }
  &.act { background: #eef2ff; color: #3730a3; border-left-color: #6366f1; }
}

// ===== 响应式 =====
@media (max-width: 1024px) {
  .ar-overview { grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .ov-card { padding: 16px 10px; .ov-num { font-size: 26px; } }
}

@media (max-width: 768px) {
  .ar-root { max-width: 100%; }
  .ar-title { font-size: 22px; }
  .ar-sub { font-size: 13px; margin-bottom: 16px; }
  .ar-overview { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .ar-charts { grid-template-columns: 1fr; gap: 12px; }
  .chart-container { height: 260px; }
  .ov-card { padding: 16px; border-radius: 12px;
    .ov-num { font-size: 26px; }
  }
}

@media (max-width: 480px) {
  .ar-title { font-size: 20px; }
  .ar-sub { font-size: 12px; }
  .ov-card { padding: 14px; font-size: 12px;
    .ov-num { font-size: 24px; }
  }
  .chart-card { border-radius: 14px; }
  .chart-container { height: 220px; }
  .insight { padding: 12px 14px; font-size: 13px; border-radius: 10px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .ar-title { color: #e2dee9; }
  .ar-sub { color: #64748b; }
  .ov-card {
    background: #1e1e2e; border-color: #2d2d4a; color: #94a3b8;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .ov-num { color: #e2dee9; }
  }
  .chart-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    .el-card__header { border-bottom-color: #252540; background: #212136; color: #e2dee9; }
  }
  .insight {
    &.con { background: rgba(16, 185, 129, 0.08); color: #6ee7b7; border-left-color: #10b981; }
    &.pen { background: rgba(245, 158, 11, 0.08); color: #fcd34d; border-left-color: #f59e0b; }
    &.act { background: rgba(167, 139, 250, 0.08); color: #c4b5fd; border-left-color: #a78bfa; }
  }
}
</style>

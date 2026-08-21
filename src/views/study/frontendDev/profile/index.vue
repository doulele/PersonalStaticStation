<template>
  <div class="profile-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">学习中心</h1>
    </div>

    <!-- 用户档案 -->
    <div class="profile-card" :style="{ '--lv-color': levelColor }">
      <div class="profile-left">
        <div class="avatar">{{ avatarText }}</div>
        <div class="profile-info">
          <div class="profile-name">
            {{ nickname }}
            <span class="level-badge" :style="{ background: levelColor }">{{ levelName }}</span>
          </div>
          <div class="xp-bar-wrap">
            <div class="xp-bar">
              <div class="xp-bar-fill" :style="{ width: xpPercent + '%', background: levelColor }"></div>
            </div>
            <div class="xp-text">{{ xp }} / {{ nextXpText }} 经验值</div>
          </div>
        </div>
      </div>
      <el-button class="checkin-btn" :disabled="checkedToday" @click="doCheckin">
        {{ checkedToday ? '今日已打卡' : '每日打卡 +3' }}
      </el-button>
    </div>

    <!-- 统计 -->
    <div class="stats-grid">
      <div class="stat-card"><div class="s-num">{{ progress?.learnedCount || 0 }}</div><div class="s-label">点亮节点</div></div>
      <div class="stat-card"><div class="s-num">{{ progress?.answerTotal || 0 }}</div><div class="s-label">累计答题</div></div>
      <div class="stat-card"><div class="s-num">{{ accuracy }}%</div><div class="s-label">正确率</div></div>
      <div class="stat-card"><div class="s-num">{{ progress?.checkinStreak || 0 }}</div><div class="s-label">连续打卡</div></div>
      <div class="stat-card"><div class="s-num">{{ progress?.checkinCount || 0 }}</div><div class="s-label">打卡天数</div></div>
      <div class="stat-card"><div class="s-num">{{ achievementCount }}/{{ ACHIEVEMENTS.length }}</div><div class="s-label">成就</div></div>
    </div>

    <!-- 分类进度 -->
    <div class="panel">
      <h2 class="panel-title">分类进度</h2>
      <div class="cat-progress-list">
        <router-link
          v-for="c in categoryRows"
          :key="c.id"
          :to="`/study/frontend-dev/map/${c.id}`"
          class="cat-row"
        >
          <span class="cat-row-icon">{{ c.icon }}</span>
          <span class="cat-row-name">{{ c.name }}</span>
          <div class="cat-row-bar">
            <div class="cat-row-fill" :style="{ width: c.percent + '%', background: c.color }"></div>
          </div>
          <span class="cat-row-meta">{{ c.learned }}/{{ c.total }}</span>
          <span class="cat-row-pct" :style="{ color: c.color }">{{ c.percent }}%</span>
        </router-link>
      </div>
    </div>

    <!-- 打卡日历 -->
    <div class="panel">
      <div class="panel-head">
        <h2 class="panel-title">打卡日历</h2>
        <span class="panel-sub">连续打卡 {{ progress?.checkinStreak || 0 }} 天</span>
      </div>
      <div class="calendar">
        <div class="cal-week">
          <span v-for="w in weekDays" :key="w" class="cal-wd">{{ w }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(d, i) in calendarCells"
            :key="i"
            class="cal-cell"
            :class="{ checked: d.checked, empty: !d.day }"
          >
            <span v-if="d.day" class="cal-day">{{ d.day }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <div class="panel">
      <h2 class="panel-title">成就墙</h2>
      <div class="achievement-grid">
        <div
          v-for="ach in ACHIEVEMENTS"
          :key="ach.id"
          class="ach-card"
          :class="{ got: isGot(ach.id) }"
        >
          <div class="ach-icon">{{ ach.icon }}</div>
          <div class="ach-name">{{ ach.name }}</div>
          <div class="ach-desc">{{ ach.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { CATEGORIES } from '../data/categories'
import { ACHIEVEMENTS, LEVELS_XP, getNextLevel } from '../data/meta'

const router = useRouter()
const store = useStore()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const progress = computed(() => store.getters['frontendDev/progress'])
const xp = computed(() => store.getters['frontendDev/xp'])
const levelKey = computed(() => store.getters['frontendDev/levelKey'])
const checkinDates = computed(() => store.getters['frontendDev/checkinDates'])
const achievementIds = computed(() => store.getters['frontendDev/achievementIds'])

const nickname = computed(() => store.getters['auth/currentUser']?.nickname || '学习者')
const avatarText = computed(() => (nickname.value || '学').slice(0, 1))

const currentLevel = computed(() => LEVELS_XP.find(l => l.key === levelKey.value) || LEVELS_XP[0])
const levelName = computed(() => currentLevel.value.name)
const levelColor = computed(() => currentLevel.value.color)

const nextLevel = computed(() => getNextLevel(xp.value))
const xpPercent = computed(() => {
  if (!nextLevel.value) return 100
  const cur = currentLevel.value
  const span = nextLevel.value.min - cur.min
  return span > 0 ? Math.round(((xp.value - cur.min) / span) * 100) : 0
})
const nextXpText = computed(() => nextLevel.value ? nextLevel.value.min : '已满级')

const accuracy = computed(() => {
  const t = progress.value?.answerTotal || 0
  const c = progress.value?.answerCorrect || 0
  return t ? Math.round((c / t) * 100) : 0
})

const achievementCount = computed(() => achievementIds.value.length)
function isGot(id) { return achievementIds.value.includes(id) }

const checkedToday = computed(() => {
  const d = new Date()
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return checkinDates.value.includes(key)
})

const categoryRows = computed(() => {
  const pct = progress.value?.categoryPercent || {}
  return CATEGORIES.map(c => {
    const info = pct[c.id] || { learned: 0, total: 0, percent: 0 }
    return { ...c, ...info }
  }).sort((a, b) => b.percent - a.percent)
})

// 打卡日历
const calendarCells = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const checkSet = new Set(checkinDates.value)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, checked: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, checked: checkSet.has(key) })
  }
  return cells
})

async function doCheckin() {
  const res = await store.dispatch('frontendDev/checkin')
  if (res.success) {
    ElMessage.success(`打卡成功 +${res.data?.gained || 3} 经验值`)
  }
}

function goBack() {
  router.push('/study/frontend-dev')
}

onMounted(() => {
  store.dispatch('frontendDev/loadProgress')
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode .profile-page {
  .page-title { color: #e2dee9; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .profile-card { background: #1e1e2e; border-color: #2d2d4a; }
  .profile-name { color: #e2dee9; }
  .stat-card { background: #1e1e2e; border-color: #2d2d4a; }
  .s-num { color: #e2dee9; }
  .s-label { color: #94a3b8; }
  .panel { background: #1e1e2e; border-color: #2d2d4a; }
  .panel-title { color: #e2dee9; }
  .cat-row-name { color: #cbd5e1; }
  .cat-row-meta { color: #94a3b8; }
  .ach-card { background: #1e1e2e; border-color: #2d2d4a; }
  .ach-name { color: #cbd5e1; }
  .ach-desc { color: #94a3b8; }
  .cal-wd { color: #94a3b8; }
}
</style>

<template>
  <div class="fdev-page">
    <!-- 顶部概览 -->
    <div class="hero">
      <div class="hero-info">
        <h1 class="hero-title">前端知识图谱</h1>
        <p class="hero-desc">学 · 练 · 测 · 评 一体化前端技能成长平台</p>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="stat-value" :style="{ color: levelColor }">{{ levelName }}</span>
          <span class="stat-label">当前等级</span>
        </div>
        <div class="hero-stat">
          <span class="stat-value">{{ xp }}</span>
          <span class="stat-label">经验值</span>
        </div>
        <div class="hero-stat">
          <span class="stat-value">{{ checkinStreak }}</span>
          <span class="stat-label">连续打卡(天)</span>
        </div>
      </div>
    </div>

    <!-- 学习统计 -->
    <div class="stats-bar">
      <div class="stat-cell">
        <div class="stat-num">{{ progress?.learnedCount || 0 }}</div>
        <div class="stat-txt">点亮节点</div>
      </div>
      <div class="stat-cell">
        <div class="stat-num">{{ progress?.answerTotal || 0 }}</div>
        <div class="stat-txt">累计答题</div>
      </div>
      <div class="stat-cell">
        <div class="stat-num">{{ accuracy }}%</div>
        <div class="stat-txt">正确率</div>
      </div>
      <div class="stat-cell">
        <div class="stat-num">{{ progress?.wrong?.length || 0 }}</div>
        <div class="stat-txt">错题</div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="section">
      <h2 class="section-title">快捷入口</h2>
      <div class="quick-grid">
        <router-link to="/study/frontend-dev/quiz?tag=八股文" class="quick-card baguwen">
          <span class="quick-icon">📝</span>
          <span class="quick-name">八股文刷题</span>
          <span class="quick-desc">{{ overview.baguwenTotal || 0 }} 题</span>
        </router-link>
        <router-link to="/study/frontend-dev/quiz?tag=框架原理" class="quick-card framework">
          <span class="quick-icon">🔬</span>
          <span class="quick-name">框架原理刷题</span>
          <span class="quick-desc">{{ overview.frameworkTotal || 0 }} 题</span>
        </router-link>
        <router-link to="/study/frontend-dev/wrong" class="quick-card wrong">
          <span class="quick-icon">📕</span>
          <span class="quick-name">错题本</span>
          <span class="quick-desc">{{ progress?.wrong?.length || 0 }} 题待攻克</span>
        </router-link>
        <router-link to="/study/frontend-dev/favorites" class="quick-card fav">
          <span class="quick-icon">⭐</span>
          <span class="quick-name">收藏夹</span>
          <span class="quick-desc">{{ progress?.favorites?.length || 0 }} 题</span>
        </router-link>
        <router-link to="/study/frontend-dev/interview" class="quick-card interview">
          <span class="quick-icon">🎯</span>
          <span class="quick-name">面试模拟</span>
          <span class="quick-desc">整卷模拟·评分报告</span>
        </router-link>
        <router-link to="/study/frontend-dev/skills" class="quick-card skills">
          <span class="quick-icon">📊</span>
          <span class="quick-name">技能全景</span>
          <span class="quick-desc">指纹图谱 · 能力分析</span>
        </router-link>
        <router-link to="/study/frontend-dev/profile" class="quick-card profile">
          <span class="quick-icon">🏅</span>
          <span class="quick-name">学习中心</span>
          <span class="quick-desc">打卡·成就·统计</span>
        </router-link>
      </div>
    </div>

    <!-- 知识地图 -->
    <div class="section">
      <h2 class="section-title">知识地图 <span class="section-sub">共 {{ totalNodes }} 个知识点</span></h2>
      <div class="cat-grid">
        <router-link
          v-for="cat in sortedCategories"
          :key="cat.id"
          :to="`/study/frontend-dev/map/${cat.id}`"
          class="cat-card"
          :style="{ '--cat-color': cat.color }"
        >
          <div class="cat-head">
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-percent" :class="{ full: cat.percent >= 100 }">{{ cat.percent }}%</span>
          </div>
          <h3 class="cat-name">{{ cat.name }}</h3>
          <div class="cat-progress">
            <div class="cat-progress-bar" :style="{ width: cat.percent + '%', background: cat.color }"></div>
          </div>
          <div class="cat-meta">
            <span>{{ cat.learned }}/{{ cat.total }} 节点</span>
            <span v-if="cat.special" class="cat-tag">专项</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- 数据来源说明 -->
    <div class="source-note">
      <div class="source-note-head" @click="showSource = !showSource">
        <el-icon><InfoFilled /></el-icon>
        <span>内容来源与质量标准</span>
        <el-icon class="toggle"><ArrowDown v-if="!showSource" /><ArrowUp v-else /></el-icon>
      </div>
      <div v-if="showSource" class="source-note-body">
        <ul>
          <li><b>原创命题</b>：全部知识点与题目围绕高频考点原创编写，不搬运第三方题库原文</li>
          <li><b>官方为准</b>：内容以 MDN、Vue / React / TypeScript 官方文档为准绳校对，知识点卡片标注来源徽章并附参考链接</li>
          <li><b>质量分层</b>：题目覆盖记忆、理解、场景、手写多种类型，解析含原理与易错点</li>
          <li><b>持续优化</b>：题库定期修订，答题正确率数据用于标注易错考点</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { ArrowDown, ArrowUp, InfoFilled } from '@element-plus/icons-vue'
import { CATEGORIES } from './data/categories'
import { LEVELS_XP } from './data/meta'
import { getOverview } from '@/api/knowledgeGraph'

const store = useStore()
const progress = computed(() => store.getters['frontendDev/progress'])
const xp = computed(() => store.getters['frontendDev/xp'])
const checkinStreak = computed(() => store.getters['frontendDev/checkinStreak'])

const overview = ref({})
const showSource = ref(false)

const totalNodes = computed(() =>
  Object.values(progress.value?.categoryPercent || {}).reduce((sum, c) => sum + c.total, 0)
)

const levelKey = computed(() => store.getters['frontendDev/levelKey'])
const currentLevel = computed(() => LEVELS_XP.find(l => l.key === levelKey.value) || LEVELS_XP[0])
const levelName = computed(() => currentLevel.value.name)
const levelColor = computed(() => currentLevel.value.color)

const accuracy = computed(() => {
  const total = progress.value?.answerTotal || 0
  const correct = progress.value?.answerCorrect || 0
  return total ? Math.round((correct / total) * 100) : 0
})

const sortedCategories = computed(() => {
  const pct = progress.value?.categoryPercent || {}
  return CATEGORIES
    .map(cat => {
      const info = pct[cat.id] || { learned: 0, total: 0, percent: 0 }
      return { ...cat, ...info }
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
})

onMounted(async () => {
  store.dispatch('frontendDev/loadProgress')
  const res = await getOverview()
  if (res.success) overview.value = res.data
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss" scoped>
// 移动端 padding 兜底（直接 inline，确保不被外链 scss 缓存影响）
@media (max-width: 768px) {
  .fdev-page { padding: 18px 18px 36px !important; }
  .hero { padding: 22px !important; }
  .stats-bar { padding: 18px !important; }
  .quick-card { padding: 16px !important; }
  .cat-card { padding: 16px !important; }
}

@media (max-width: 480px) {
  .fdev-page { padding: 14px 14px 32px !important; }
  .hero { padding: 18px 16px !important; }
  .stats-bar { padding: 14px !important; }
  .quick-card { padding: 13px 12px !important; }
  .cat-card { padding: 13px 12px !important; }
}
</style>

<style lang="scss">
html.dark-mode {
  .hero { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); }
  .hero-title { color: #f1eefe; }
  .hero-desc { color: #a5b4fc; }
  .hero-stat .stat-value { color: #f1eefe; }
  .hero-stat .stat-label { color: #a5b4fc; }
  .stats-bar { background: #1e1e2e; border-color: #2d2d4a; }
  .stat-num { color: #e2dee9; }
  .stat-txt { color: #94a3b8; }
  .section-title { color: #e2dee9; }
  .section-sub { color: #64748b; }
  .quick-card { background: #1e1e2e; border-color: #2d2d4a; }
  .quick-name { color: #e2dee9; }
  .quick-desc { color: #94a3b8; }
  .cat-card { background: #1e1e2e; border-color: #2d2d4a; }
  .cat-name { color: #e2dee9; }
  .cat-meta { color: #94a3b8; }
}
</style>

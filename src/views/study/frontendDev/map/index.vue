<template>
  <div class="map-page">
    <!-- 顶部 -->
    <div class="map-header" :style="{ '--cat-color': cat?.color || '#6366f1' }">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <div class="map-header-info">
        <span class="map-icon">{{ cat?.icon || '📚' }}</span>
        <div>
          <h1 class="map-title">{{ cat?.name || '知识地图' }}</h1>
          <p class="map-desc">{{ cat?.desc || '' }}</p>
        </div>
      </div>
      <div class="map-progress-wrap">
        <div class="map-progress-num">
          <b :style="{ color: cat?.color }">{{ percent }}%</b>
          <span>完成度</span>
        </div>
        <div class="map-progress-bar">
          <div class="map-progress-inner" :style="{ width: percent + '%', background: cat?.color }"></div>
        </div>
        <div class="map-progress-meta">已点亮 {{ learnedCount }}/{{ nodes.length }} 节点</div>
      </div>
    </div>

    <!-- 分类切换 -->
    <nav v-if="!notFound" class="cat-tabs">
      <router-link
        v-for="c in CATEGORIES"
        :key="c.id"
        :to="`/study/frontend-dev/map/${c.id}`"
        class="cat-tab"
        :class="{ active: c.id === catId }"
        :style="{ '--tab-color': c.color }"
      >
        <span class="cat-tab-icon">{{ c.icon }}</span>
        <span class="cat-tab-name">{{ c.name }}</span>
        <span v-if="c.special" class="cat-tab-special">专项</span>
      </router-link>
    </nav>

    <!-- 工具栏 -->
    <div v-if="!notFound" class="map-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="keyword"
          placeholder="搜索知识点"
          clearable
          class="map-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="levelFilter" placeholder="难度筛选" clearable class="map-level-filter">
          <el-option v-for="l in LEVELS" :key="l.id" :label="l.name" :value="l.id" />
        </el-select>
      </div>
      <div class="level-legend">
        <span v-for="l in LEVELS" :key="l.id" class="legend-item">
          <i :style="{ background: l.color }"></i>{{ l.name }}
        </span>
      </div>
    </div>

    <!-- 难度分布统计 -->
    <div v-if="!notFound && levelStats.length" class="map-stats">
      <div
        v-for="s in levelStats"
        :key="s.level"
        class="stat-pill"
        :class="{ done: s.total && s.learned === s.total }"
        :style="{ '--lvl-color': s.color }"
      >
        <div class="stat-pill-head">
          <span class="stat-pill-name">{{ s.name }}</span>
          <span class="stat-pill-num">{{ s.learned }}/{{ s.total }}</span>
        </div>
        <div class="stat-pill-bar">
          <div class="stat-pill-inner" :style="{ width: s.percent + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 推荐学习 -->
    <div v-if="!notFound && recommended" class="map-recommend" :style="{ '--cat-color': cat?.color || '#6366f1' }">
      <el-icon class="rec-icon"><Compass /></el-icon>
      <div class="rec-body">
        <span class="rec-label">建议下一个学习</span>
        <button class="rec-name" @click="openNode(recommended)">
          {{ recommended.name }}
          <span class="rec-level" :style="{ background: levelColor(recommended.level) }">{{ levelName(recommended.level) }}</span>
        </button>
      </div>
      <span class="rec-tip">按顺序逐个掌握更高效</span>
    </div>

    <!-- 节点格点 -->
    <div v-loading="loading" class="node-grid">
      <template v-if="!notFound">
        <button
          v-for="node in filteredNodes"
          :key="node.id"
          class="node-cell"
          :class="{ lit: isLearned(node.id), locked: isLocked(node), recommended: recommended && node.id === recommended.id }"
          :style="{ '--cat-color': cat?.color || '#6366f1' }"
          @click="openNode(node)"
        >
          <div class="node-light"></div>
          <div class="node-level" :style="{ background: levelColor(node.level) }">{{ levelName(node.level) }}</div>
          <div class="node-name">{{ node.name }}</div>
          <div class="node-state">
            <template v-if="isLocked(node)">
              <el-icon><Lock /></el-icon>
              <span>需先学 {{ node.deps.length }} 个前置</span>
            </template>
            <template v-else-if="isLearned(node.id)">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>已掌握</span>
            </template>
            <span v-else>未点亮</span>
          </div>
        </button>

        <el-empty v-if="!loading && !filteredNodes.length" description="没有匹配的知识点，试试调整搜索或难度" class="map-empty" />
      </template>
      <el-empty v-else-if="!loading" description="分类不存在或已下线" class="map-empty">
        <el-button type="primary" @click="goBack">返回知识地图首页</el-button>
      </el-empty>
    </div>

    <!-- 知识卡片 -->
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Lock, CircleCheckFilled, Search, Compass } from '@element-plus/icons-vue'
import { getNodes } from '@/api/knowledgeGraph'
import { CATEGORIES, LEVELS, getLevel } from '../data/categories'
import KnowledgeCard from '../components/KnowledgeCard.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const catId = computed(() => route.params.cat)
const cat = computed(() => CATEGORIES.find(c => c.id === catId.value))
const notFound = computed(() => !cat.value)

const nodes = ref([])
const loading = ref(false)
const cardVisible = ref(false)
const currentNodeId = ref('')
const keyword = ref('')
const levelFilter = ref('')

const learnedIds = computed(() => store.getters['frontendDev/learnedIds'])

const learnedCount = computed(() => nodes.value.filter(n => learnedIds.value.includes(n.id)).length)
const percent = computed(() => nodes.value.length ? Math.round((learnedCount.value / nodes.value.length) * 100) : 0)

// 搜索 + 难度筛选（视图层过滤，不影响进度统计）
const filteredNodes = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return nodes.value.filter(n => {
    if (levelFilter.value && n.level !== levelFilter.value) return false
    if (kw && !n.name.toLowerCase().includes(kw)) return false
    return true
  })
})

// 难度分布统计
const levelStats = computed(() =>
  LEVELS.map(l => {
    const list = nodes.value.filter(n => n.level === l.id)
    const learned = list.filter(n => learnedIds.value.includes(n.id)).length
    return {
      level: l.id,
      name: l.name,
      color: l.color,
      total: list.length,
      learned,
      percent: list.length ? Math.round((learned / list.length) * 100) : 0
    }
  }).filter(s => s.total > 0)
)

// 推荐下一个学习节点：未点亮 + 前置已满足，取 sort 最小
const recommended = computed(() => {
  const list = nodes.value
    .filter(n => !learnedIds.value.includes(n.id) && !isLocked(n))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return list[0] || null
})

function isLearned(id) { return learnedIds.value.includes(id) }

// 前置依赖未满足则锁定
function isLocked(node) {
  if (!node.deps || !node.deps.length) return false
  return node.deps.some(d => !learnedIds.value.includes(d))
}

function levelName(l) { return getLevel(l)?.name || '' }
function levelColor(l) { return getLevel(l)?.color || '#94a3b8' }

function openNode(node) {
  if (isLocked(node)) {
    const names = (node.deps || [])
      .map(id => nodes.value.find(n => n.id === id)?.name || id)
      .join('、')
    ElMessage.warning(`需先掌握前置知识：${names}`)
    return
  }
  currentNodeId.value = node.id
  cardVisible.value = true
}

function onSwitchNode(id) {
  currentNodeId.value = id
}

function onLearned() {
  // 刷新进度
  store.dispatch('frontendDev/loadProgress')
}

function goBack() {
  router.push('/study/frontend-dev')
}

async function load() {
  loading.value = true
  try {
    const res = await getNodes(catId.value)
    if (res.success) nodes.value = res.data || []
  } finally {
    loading.value = false
  }
}

watch(() => route.params.cat, (val, old) => {
  if (val === old) return
  keyword.value = ''
  levelFilter.value = ''
  cardVisible.value = false
  if (!notFound.value) {
    store.dispatch('frontendDev/loadProgress')
    load()
  }
})

onMounted(() => {
  store.dispatch('frontendDev/loadProgress')
  if (!notFound.value) load()
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode .map-page {
  .map-header { background: #1e1e2e; border-color: #2d2d4a; }
  .map-title { color: #e2dee9; }
  .map-desc { color: #94a3b8; }
  .map-progress-num span, .map-progress-meta { color: #94a3b8; }
  .node-cell { background: #1e1e2e; border-color: #2d2d4a; }
  .node-name { color: #cbd5e1; }
  .node-state { color: #64748b; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .cat-tab { background: #1e1e2e; border-color: #2d2d4a; color: #94a3b8;
    &:hover { border-color: var(--tab-color); color: var(--tab-color); }
    &.active { background: color-mix(in srgb, var(--tab-color) 16%, #1e1e2e); border-color: var(--tab-color); color: var(--tab-color); }
  }
  .cat-tab-special { background: #3f1d24; color: #fca5a5; }
  .map-toolbar { border-color: #2d2d4a; }
  .level-legend { color: #94a3b8; }
  .map-stats { border-color: #2d2d4a; }
  .stat-pill-name { color: #cbd5e1; }
  .stat-pill-num { color: #94a3b8; }
  .map-recommend { background: color-mix(in srgb, var(--cat-color) 12%, #1e1e2e); border-color: color-mix(in srgb, var(--cat-color) 40%, #2d2d4a); }
  .rec-label { color: #94a3b8; }
  .rec-name { color: #e2dee9; &:hover { color: var(--cat-color); } }
  .rec-tip { color: #64748b; }
  .map-empty { color: #94a3b8; }
}
</style>

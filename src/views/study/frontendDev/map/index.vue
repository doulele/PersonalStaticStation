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

    <!-- 节点格点 -->
    <div v-loading="loading" class="node-grid">
      <button
        v-for="node in nodes"
        :key="node.id"
        class="node-cell"
        :class="{ lit: isLearned(node.id), locked: isLocked(node) }"
        :style="{ '--cat-color': cat?.color || '#6366f1' }"
        @click="openNode(node)"
      >
        <div class="node-light"></div>
        <div class="node-level" :style="{ background: levelColor(node.level) }">{{ levelName(node.level) }}</div>
        <div class="node-name">{{ node.name }}</div>
        <div class="node-state">
          <el-icon v-if="isLocked(node)"><Lock /></el-icon>
          <el-icon v-else-if="isLearned(node.id)"><CircleCheckFilled /></el-icon>
          <span v-else>未点亮</span>
        </div>
      </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowLeft, Lock, CircleCheckFilled } from '@element-plus/icons-vue'
import { getNodes } from '@/api/knowledgeGraph'
import { CATEGORIES, getLevel } from '../data/categories'
import KnowledgeCard from '../components/KnowledgeCard.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const catId = computed(() => route.params.cat)
const cat = computed(() => CATEGORIES.find(c => c.id === catId.value))

const nodes = ref([])
const loading = ref(false)
const cardVisible = ref(false)
const currentNodeId = ref('')

const learnedIds = computed(() => store.getters['frontendDev/learnedIds'])

const learnedCount = computed(() => nodes.value.filter(n => learnedIds.value.includes(n.id)).length)
const percent = computed(() => nodes.value.length ? Math.round((learnedCount.value / nodes.value.length) * 100) : 0)

function isLearned(id) { return learnedIds.value.includes(id) }

// 前置依赖未满足则锁定
function isLocked(node) {
  if (!node.deps || !node.deps.length) return false
  return node.deps.some(d => !learnedIds.value.includes(d))
}

function levelName(l) { return getLevel(l)?.name || '' }
function levelColor(l) { return getLevel(l)?.color || '#94a3b8' }

function openNode(node) {
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

onMounted(async () => {
  store.dispatch('frontendDev/loadProgress')
  loading.value = true
  try {
    const res = await getNodes(catId.value)
    if (res.success) nodes.value = res.data || []
  } finally {
    loading.value = false
  }
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
}
</style>

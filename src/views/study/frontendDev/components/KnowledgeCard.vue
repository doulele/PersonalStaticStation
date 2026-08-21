<template>
  <el-drawer
    :model-value="visible"
    direction="rtl"
    size="520px"
    class="knowledge-card"
    :with-header="false"
    @update:model-value="close"
  >
    <div v-loading="loading" class="kc-body">
      <template v-if="!loading && node">
        <!-- 头部 -->
        <div class="kc-header">
          <button class="kc-close" @click="close">
            <el-icon><Close /></el-icon>
          </button>
          <div class="kc-tags">
            <span class="kc-level" :style="{ background: levelColor }">{{ levelName }}</span>
            <span class="kc-cat">{{ catName }}</span>
          </div>
          <h2 class="kc-title">{{ node.name }}</h2>
        </div>

        <!-- 内容 -->
        <div class="kc-content markdown-body" v-html="rendered"></div>

        <!-- 前置/进阶 -->
        <div v-if="prereqs.length || advanced.length" class="kc-relations">
          <div v-if="prereqs.length" class="rel-block">
            <div class="rel-title">前置知识</div>
            <div class="rel-chips">
              <button v-for="p in prereqs" :key="p.id" class="rel-chip" @click="switchNode(p.id)">
                {{ p.name }}
              </button>
            </div>
          </div>
          <div v-if="advanced.length" class="rel-block">
            <div class="rel-title">进阶知识</div>
            <div class="rel-chips">
              <button v-for="p in advanced" :key="p.id" class="rel-chip" @click="switchNode(p.id)">
                {{ p.name }}
              </button>
            </div>
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="加载失败" />
    </div>

    <!-- 底部操作 -->
    <template #footer>
      <div class="kc-footer">
        <el-button
          v-if="!isLearned"
          type="success"
          plain
          @click="markLearned"
        >
          标记为已掌握
        </el-button>
        <el-button v-else disabled>已掌握 ✓</el-button>
        <el-button type="primary" @click="quizVisible = true">
          <el-icon><EditPen /></el-icon>
          <span>开始测验</span>
        </el-button>
      </div>
    </template>

    <!-- 随堂测验 -->
    <QuizDialog
      v-model:visible="quizVisible"
      :node-id="node?.id || ''"
      :node-name="node?.name || ''"
      @learned="onLearned"
    />
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { Close, EditPen } from '@element-plus/icons-vue'
import { getNodeDetail } from '@/api/knowledgeGraph'
import { CATEGORIES, getLevel } from '../data/categories'
import { renderMarkdown } from '../utils/markdown'
import QuizDialog from './QuizDialog.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  nodeId: { type: String, default: '' },
  allNodes: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:visible', 'learned', 'switch-node'])

const store = useStore()
const loading = ref(false)
const node = ref(null)
const quizVisible = ref(false)

const isLearned = computed(() => store.getters['frontendDev/isLearned'](node.value?.id))
const rendered = computed(() => renderMarkdown(node.value?.content || ''))

const levelName = computed(() => getLevel(node.value?.level)?.name || '')
const levelColor = computed(() => getLevel(node.value?.level)?.color || '#94a3b8')
const catName = computed(() => CATEGORIES.find(c => c.id === node.value?.cat)?.name || '')

const prereqs = computed(() => {
  if (!node.value || !props.allNodes.length) return []
  return (node.value.deps || []).map(id => props.allNodes.find(n => n.id === id)).filter(Boolean)
})

const advanced = computed(() => {
  if (!node.value || !props.allNodes.length) return []
  return props.allNodes.filter(n => (n.deps || []).includes(node.value.id))
})

async function load() {
  if (!props.nodeId) return
  loading.value = true
  node.value = null
  try {
    const res = await getNodeDetail(props.nodeId)
    if (res.success) node.value = res.data
  } finally {
    loading.value = false
  }
}

async function markLearned() {
  const res = await store.dispatch('frontendDev/learn', node.value.id)
  if (res.success) emit('learned', node.value.id)
}

function onLearned(nodeId) {
  emit('learned', nodeId)
}

function switchNode(id) {
  emit('switch-node', id)
}

function close() {
  emit('update:visible', false)
}

watch(() => props.visible, (v) => {
  if (v) load()
})
watch(() => props.nodeId, (id) => {
  if (props.visible && id) load()
})
</script>

<style lang="scss" scoped>
.kc-body {
  padding: 0 4px;
}

.kc-header {
  position: relative;
  margin-bottom: 20px;
  padding-right: 40px;
}

.kc-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #f1f5f9; color: #0f172a; }
}

.kc-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.kc-level {
  padding: 2px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
}

.kc-cat {
  padding: 2px 10px;
  border-radius: 999px;
  background: #ede9fe;
  color: #7c3aed;
  font-size: 12px;
}

.kc-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.kc-content {
  font-size: 14px;
  color: #334155;
  line-height: 1.7;
}

.kc-relations {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rel-title {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.rel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rel-chip {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  &:hover { border-color: #6366f1; color: #6366f1; }
}

.kc-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>

<style lang="scss">
html.dark-mode .knowledge-card {
  .kc-title { color: #e2dee9; }
  .kc-content { color: #94a3b8; }
  .kc-close { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .rel-chip { background: #232338; border-color: #2d2d4a; color: #cbd5e1; }
  .kc-cat { background: #2d2d4a; }
}
</style>

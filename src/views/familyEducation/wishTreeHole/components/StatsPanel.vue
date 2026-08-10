<template>
  <el-drawer :model-value="visible" @update:model-value="(val) => emit('update:visible', val)" title="数据统计" :size="direction === 'btt' ? '70%' : '400px'" :direction="direction" destroy-on-close>
    <div class="stats-panel" v-loading="loading">
      <!-- 个人数据看板 -->
      <div class="stats-section">
        <h3 class="stats-section-title">📊 个人数据</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-num">{{ stats?.total || 0 }}</div>
            <div class="stat-label">全部愿望</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-num">{{ stats?.active || 0 }}</div>
            <div class="stat-label">进行中</div>
          </div>
          <div class="stat-card green">
            <div class="stat-num">{{ stats?.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-num">{{ stats?.overdue || 0 }}</div>
            <div class="stat-label">已逾期</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-num">{{ stats?.moodsCount || 0 }}</div>
            <div class="stat-label">树洞数</div>
          </div>
        </div>
      </div>

      <!-- 家庭排行榜 -->
      <div class="stats-section">
        <h3 class="stats-section-title">🏆 本月家庭排行</h3>
        <div class="rank-subsection" v-if="ranking?.wishes?.length > 0">
          <p class="rank-label">愿望完成最多</p>
          <div v-for="(r, idx) in ranking.wishes" :key="'w'+idx" class="rank-item">
            <span class="rank-pos">{{ ['🥇','🥈','🥉'][idx] || (idx+1) }}</span>
            <span class="rank-name">{{ r.nickname || '成员' }}</span>
            <span class="rank-count">{{ r.count }}个</span>
          </div>
        </div>
        <div class="rank-subsection" v-if="ranking?.moods?.length > 0">
          <p class="rank-label">树洞最活跃</p>
          <div v-for="(r, idx) in ranking.moods" :key="'m'+idx" class="rank-item">
            <span class="rank-pos">{{ ['🥇','🥈','🥉'][idx] || (idx+1) }}</span>
            <span class="rank-name">{{ r.nickname || '成员' }}</span>
            <span class="rank-count">{{ r.count }}条</span>
          </div>
        </div>
        <div v-if="(!ranking?.wishes?.length && !ranking?.moods?.length)" class="empty-hint">
          本月暂无机，快来活跃吧！
        </div>
      </div>

      <!-- AI 破局助手 -->
      <div class="stats-section" v-if="breakthroughs.length > 0">
        <h3 class="stats-section-title">💡 AI破局助手</h3>
        <div v-for="b in breakthroughs" :key="b.wishId" class="breakthrough-card">
          <div class="bt-title">想实现「{{ b.wishTitle }}」？</div>
          <ul class="bt-tips">
            <li v-for="(tip, i) in b.tips" :key="i">{{ tip }}</li>
          </ul>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { getAiBreakthrough } from '@/api/wishTreeHole'

const props = defineProps({ visible: Boolean, direction: { type: String, default: 'rtl' } })
const emit = defineEmits(['update:visible'])
const store = useStore()

const stats = computed(() => store.state.wishTreeHole.stats)
const ranking = computed(() => store.state.wishTreeHole.ranking)
const breakthroughs = ref([])
const loading = ref(false)

async function loadBreakthroughs() {
  loading.value = true
  try {
    const res = await getAiBreakthrough()
    if (res.success) breakthroughs.value = res.data
  } catch { /* ignore */ }
  loading.value = false
}

watch(() => props.visible, (v) => {
  if (v) {
    store.dispatch('wishTreeHole/loadStats')
    loadBreakthroughs()
  }
})
</script>

<style lang="scss" scoped src="./StatsPanel.scss"></style>

<style lang="scss">
html.dark-mode {
  .stats-section-title { color: #e2dee9; }
  .stat-card { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } }
  .stat-label { color: #64748b; }
  .rank-item { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } }
  .rank-name { color: #e2dee9; }
  .rank-count { color: #a78bfa; }
  .rank-label { color: #94a3b8; }
  .breakthrough-card { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } }
  .bt-title { color: #e2dee9; }
  .bt-tips li { color: #94a3b8; }
  .empty-hint { color: #64748b; }
}
</style>

<template>
  <el-drawer :model-value="visible" @update:model-value="(val) => emit('update:visible', val)" title="数据统计" size="400px" direction="rtl" destroy-on-close>
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

const props = defineProps({ visible: Boolean })
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

<style lang="scss" scoped>
.stats-section {
  margin-bottom: 28px;
}

.stats-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  text-align: center;
  padding: 16px 10px;
  background: #f8fafc;
  border-radius: 12px;

  &.blue { background: #eef2ff; }
  &.green { background: #ecfdf5; }
  &.orange { background: #fffbeb; }
  &.purple { background: #f5f3ff; }
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  .blue & { color: #3b82f6; }
  .green & { color: #10b981; }
  .orange & { color: #f59e0b; }
  .purple & { color: #8b5cf6; }
}

.stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.rank-subsection {
  margin-bottom: 14px;
}

.rank-label {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 8px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8fafc;
  margin-bottom: 6px;
}

.rank-pos { font-size: 18px; }
.rank-name { flex: 1; font-size: 14px; color: #0f172a; font-weight: 500; }
.rank-count { font-size: 13px; color: #6366f1; font-weight: 600; }

.breakthrough-card {
  padding: 14px;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  border-radius: 12px;
  margin-bottom: 10px;
  .bt-title {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
  }
  .bt-tips {
    margin: 0;
    padding-left: 20px;
    li {
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
  }
}

.empty-hint {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 14px;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card { padding: 12px 8px; }
  .stat-num { font-size: 22px; }
  .stat-label { font-size: 11px; }
  .stats-section-title { font-size: 15px; }
  .breakthrough-card { padding: 12px; }
  .bt-tips li { font-size: 12px; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

<style lang="scss">
html.dark-mode {
  .stats-section-title { color: #e2dee9; }
  .stat-card { background: #252540; }
  .stat-card.blue { background: #1e2040; }
  .stat-card.green { background: #1a2e24; }
  .stat-card.orange { background: #2e2410; }
  .stat-card.purple { background: #241e40; }
  .stat-label { color: #64748b; }
  .rank-item { background: #252540; }
  .rank-name { color: #e2dee9; }
  .rank-count { color: #a78bfa; }
  .rank-label { color: #94a3b8; }
  .breakthrough-card { background: linear-gradient(135deg, #1e2040, #241e40); }
  .bt-title { color: #e2dee9; }
  .bt-tips li { color: #94a3b8; }
  .empty-hint { color: #64748b; }
}
</style>

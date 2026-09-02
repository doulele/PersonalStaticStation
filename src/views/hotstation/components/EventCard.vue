<template>
  <div class="hs-event-card" data-hs-event-card>
    <!-- 标题行 -->
    <div class="card-head">
      <div class="card-title-row">
        <h3 class="card-title" @click="$emit('view', event)">{{ event.title }}</h3>
        <span v-if="event.is_verified" class="verified-stamp" title="同一事实已被 ≥3 个高权重信源交叉验证">◆ 多方核实</span>
      </div>
      <el-button
        v-if="event.status === 'pending'"
        size="small"
        class="track-btn"
        @click="$emit('track', event)"
      ><el-icon style="margin-right: 4px"><View /></el-icon>追踪此事件</el-button>
      <el-tag v-else size="small" :type="event.status === 'tracking' ? 'primary' : 'info'">
        {{ event.status === 'tracking' ? '追踪中' : '已归档' }}
      </el-tag>
    </div>

    <!-- 摘要 -->
    <p class="card-summary">{{ event.verified_fact || event.summary || '暂无摘要' }}</p>

    <!-- 生命周期进度条 -->
    <div class="lifecycle" :title="`当前阶段：${event.lifecycle}`">
      <div class="lifecycle-track">
        <span
          v-for="stage in LIFECYCLE"
          :key="stage"
          class="lifecycle-dot"
          :class="{ active: LIFECYCLE.indexOf(stage) <= LIFECYCLE.indexOf(event.lifecycle) }"
        ></span>
      </div>
      <div class="lifecycle-labels">
        <span v-for="stage in LIFECYCLE" :key="stage" class="lifecycle-label" :class="{ cur: stage === event.lifecycle }">{{ stage }}</span>
      </div>
    </div>

    <!-- 营养标签 -->
    <div class="nutrition" v-if="event.nutrition">
      <el-tooltip :content="`数据事实字符数占比：${event.nutrition.factDensity}%`" placement="top">
        <span class="nut-pill"><el-icon><DataAnalysis /></el-icon>事实密度 {{ event.nutrition.factDensity }}%</span>
      </el-tooltip>
      <el-tooltip :content="`媒体观点与评论占比：${event.nutrition.opinionRatio}%`" placement="top">
        <span class="nut-pill"><el-icon><ChatDotRound /></el-icon>观点占比 {{ event.nutrition.opinionRatio }}%</span>
      </el-tooltip>
      <el-tooltip :content="`与近7天同话题内容的相似度：${event.nutrition.repeatScore}`" placement="top">
        <span class="nut-pill"><el-icon><RefreshRight /></el-icon>重复度 {{ event.nutrition.repeat }}</span>
      </el-tooltip>
      <el-tooltip content="opinions 层情感打分结果" placement="top">
        <span class="nut-pill"><el-icon><ScaleToOriginal /></el-icon>立场 {{ event.nutrition.lean }}</span>
      </el-tooltip>
    </div>

    <!-- 观点折叠（默认折叠） -->
    <div class="opinions-block">
      <div class="opinions-toggle" @click="opinionOpen = !opinionOpen">
        <span><el-icon style="margin-right: 4px"><Promotion /></el-icon>各方声音 ({{ opinionCount }})</span>
        <el-icon :class="{ rotated: opinionOpen }"><ArrowDown /></el-icon>
      </div>
      <div v-if="opinionOpen" class="opinions-body">
        <el-radio-group v-model="stanceFilter" size="small" class="stance-filter">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="support">支持派</el-radio-button>
          <el-radio-button value="oppose">反对派</el-radio-button>
          <el-radio-button value="neutral">中立派</el-radio-button>
        </el-radio-group>
        <div v-for="(g, gi) in groupedOpinions" :key="gi" class="stance-group">
          <div class="stance-head">{{ STANCE_NAMES[g.stance] }}</div>
          <div v-for="(op, oi) in g.items" :key="oi" class="opinion-item">
            <span class="op-source">[{{ op.source || '未知来源' }}]</span>
            <span class="op-content">{{ op.content }}</span>
          </div>
        </div>
        <div v-if="!groupedOpinions.length" class="no-opinion">暂无观点</div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="card-footer">
      <span class="report-info">{{ event.reportCount || 0 }} 篇报道 · {{ formatTime(event.last_updated) }}</span>
      <div class="footer-actions">
        <el-button size="small" @click="$emit('view', event)">详情</el-button>
        <el-button size="small" type="primary" @click="$emit('generate', event)"><el-icon style="margin-right: 4px"><EditPen /></el-icon>生成</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowDown, View, DataAnalysis, ChatDotRound, RefreshRight, ScaleToOriginal, Promotion, EditPen } from '@element-plus/icons-vue'

const props = defineProps({
  event: { type: Object, required: true }
})
defineEmits(['view', 'track', 'generate'])

const LIFECYCLE = ['孕育期', '爆发期', '发酵期', '收尾期']
const STANCE_NAMES = { support: '支持派', oppose: '反对派', neutral: '中立派' }

const opinionOpen = ref(false)
const stanceFilter = ref('all')

const opinions = computed(() => Array.isArray(props.event.opinions) ? props.event.opinions : [])
const opinionCount = computed(() => opinions.value.length + (props.event.emotions?.length || 0))

const groupedOpinions = computed(() => {
  const list = opinions.value.filter(o => stanceFilter.value === 'all' || o.stance === stanceFilter.value)
  const groups = []
  for (const stance of ['support', 'oppose', 'neutral']) {
    const items = list.filter(o => (o.stance || 'neutral') === stance)
    if (items.length) groups.push({ stance, items })
  }
  return groups
})

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const diff = Date.now() - d.getTime()
  if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}
</script>

<style lang="scss">
/* 事件卡片样式（非 scoped：子组件独立维护；渲染在 [data-hs-page] 内可继承其 CSS 变量与暗黑覆盖） */
[data-hs-event-card] {
  background: var(--hs-surface);
  border: 1px solid var(--hs-border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--hs-card-shadow);
}
.card-head { display: flex; align-items: flex-start; gap: 10px; justify-content: space-between; }
.card-title-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.card-title {
  margin: 0; font-size: 16px; font-weight: 600;
  cursor: pointer; flex: 0 1 auto;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.card-title:hover { color: var(--hs-accent); }
.verified-stamp {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--hs-verified-text);
  background: var(--hs-verified-bg);
  border: 1px solid var(--hs-verified-border);
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}
.track-btn { flex-shrink: 0; }
.card-summary {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--hs-text-2);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.lifecycle { margin-top: 12px; }
.lifecycle-track {
  display: flex; gap: 4px;
  height: 6px; border-radius: 3px;
  background: var(--hs-track);
  overflow: hidden;
}
.lifecycle-dot { flex: 1; background: var(--hs-track); transition: background 0.3s; }
.lifecycle-dot.active { background: var(--hs-dot-active); }
.lifecycle-labels { display: flex; justify-content: space-between; margin-top: 4px; }
.lifecycle-label { font-size: 11px; color: var(--hs-text-3); }
.lifecycle-label.cur { color: var(--hs-text); font-weight: 600; }
.nutrition { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.nut-pill {
  font-size: 12px;
  color: var(--hs-pill-text);
  background: var(--hs-pill-bg);
  border: 1px solid var(--hs-pill-border);
  border-radius: 999px;
  padding: 2px 10px;
  cursor: default;
}
.opinions-block { margin-top: 12px; border-top: 1px dashed var(--hs-border); padding-top: 10px; }
.opinions-toggle {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: var(--hs-text-2); cursor: pointer;
}
.opinions-toggle .el-icon { transition: transform 0.2s; }
.opinions-toggle .el-icon.rotated { transform: rotate(180deg); }
.opinions-body { margin-top: 10px; }
.stance-filter { margin-bottom: 8px; }
.stance-group { margin-bottom: 8px; }
.stance-head { font-size: 12px; font-weight: 600; color: var(--hs-text-3); margin-bottom: 4px; }
.opinion-item { font-size: 13px; color: var(--hs-text-2); line-height: 1.6; padding: 2px 0; }
.op-source { color: var(--hs-accent); font-size: 12px; margin-right: 4px; }
.no-opinion { font-size: 13px; color: var(--hs-text-3); }
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--hs-border);
}
.report-info { font-size: 12px; color: var(--hs-text-3); }
.footer-actions { display: flex; gap: 8px; }

@media (max-width: 480px) {
  .card-title { font-size: 15px; }
  .card-head { flex-wrap: wrap; }
}
</style>

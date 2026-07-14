<template>
  <div class="mw-root">
    <h2 class="mw-title">家庭会议记忆墙</h2>
    <p class="mw-sub">数据隔离 · 仅展示你参与的会议</p>

    <div v-if="meetings.length === 0" class="empty">还没有可见的会议记录</div>

    <!-- 时间轴 -->
    <div class="mw-timeline">
      <div
        v-for="(m, idx) in meetings"
        :key="m.id"
        class="mw-card"
        :class="{
          'has-pending': pendingCount(m.id) > 0,
          expanded: expanded === m.id
        }"
      >
        <!-- 时间轴线 -->
        <div class="mw-dot" :class="{ latest: idx === 0 }">
          <div class="dot-core" />
        </div>

        <div class="mw-body" @click="onExpand(m.id)">
          <div class="mw-card-hd">
            <div>
              <span class="mw-date">{{ m.date }}</span>
              <h3>{{ m.title }}</h3>
            </div>
            <div class="mw-badges">
              <el-tag v-if="m.visibility === 'private'" size="small" type="danger" effect="plain">私密</el-tag>
              <el-tag v-if="m.encrypted" size="small" type="warning" effect="plain">加密</el-tag>
              <el-tag :type="statusTag(m.status)" size="small">{{ statusText(m.status) }}</el-tag>
            </div>
          </div>

          <!-- 色块条 -->
          <div class="mw-tag-strip" v-if="tagCounts(m.id)">
            <span v-for="c in tagStrips(m.id)" :key="c.tag" class="strip-seg" :style="{ background: c.color, flex: c.count }" />
          </div>

          <!-- 统计摘要 -->
          <div class="mw-summary">
            <span v-for="s in tagSummaries(m.id)" :key="s.tag" :class="'sum-' + s.class">
              {{ s.tag }}: {{ s.count }}
            </span>
          </div>

          <!-- 补丁徽章 -->
          <div v-if="patchCount(m.id) > 0" class="patch-badge">
            <el-icon><DocumentAdd /></el-icon> {{ patchCount(m.id) }} 条补丁
          </div>

          <!-- 展开区 -->
          <div v-if="expanded === m.id" class="mw-detail" @click.stop>
            <el-divider />

            <!-- 记录列表 -->
            <div v-for="r in recordsForM(m.id)" :key="r.id" class="mw-record">
              <div class="mwr-head">
                <span class="mwr-seq">#{{ r.seq }}</span>
                <strong>{{ name(r.speakerId) }}</strong>
                <span class="mwr-time">{{ r.timestamp }}</span>
                <el-tag
                  v-for="t in allTags(r)"
                  :key="t" size="small"
                  :color="tagColor(t)" effect="dark" style="color:#fff"
                >{{ t }}</el-tag>
              </div>
              <div class="mwr-content">{{ r.content }}</div>

              <!-- 补丁历史 -->
              <div v-for="p in patchesFor(r.id)" :key="p.id" class="mwr-patch">
                <el-tag size="small" type="info" effect="plain">{{ p.patchType }}</el-tag>
                <span class="patch-author">{{ name(p.authorId) }}</span>
                <span class="patch-time">{{ formatDate(p.createdAt) }}</span>
                <div class="patch-content">{{ p.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { DocumentAdd } from '@element-plus/icons-vue'
import { TAG_COLORS } from '../utils/transcribe.js'

const store = useStore()
const expanded = ref(null)

const meetings = computed(() => {
  return store.getters['familyMeeting/visibleMeetings']
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const records = computed(() => store.state.familyMeeting.records)
const patches = computed(() => store.state.familyMeeting.patches)
const tasks = computed(() => store.state.familyMeeting.tasks)

function name(id) { return store.getters['familyMeeting/memberName'](id) }

function statusTag(s) { return { pre: 'warning', active: 'success', closed: 'info' }[s] || 'info' }
function statusText(s) { return { pre: '筹备中', active: '进行中', closed: '已结束' }[s] || s }
function tagColor(t) { return TAG_COLORS[t] || TAG_COLORS['结论'] }

function recordsForM(meetingId) {
  return records.value.filter(r => r.meetingId === meetingId).sort((a, b) => a.seq - b.seq)
}

function pendingCount(meetingId) {
  return records.value.filter(r => r.meetingId === meetingId && (r.autoTags.includes('待定') || r.manualTags.includes('待定'))).length
}

function tagCounts(meetingId) {
  const items = records.value.filter(r => r.meetingId === meetingId)
  const c = { 结论: 0, 待定: 0, 行动项: 0, 情感记录: 0 }
  items.forEach(r => {
    ;[...r.autoTags, ...r.manualTags].forEach(t => { if (c[t] !== undefined) c[t]++ })
  })
  // 只保留有数据的标签
  const total = Object.values(c).reduce((s, v) => s + v, 0)
  if (total === 0) return null
  return c
}

function tagStrips(meetingId) {
  const c = tagCounts(meetingId)
  if (!c) return []
  return Object.entries(c)
    .filter(([, v]) => v > 0)
    .map(([tag, count]) => ({ tag, count, color: TAG_COLORS[tag] || '#94a3b8' }))
}

function tagSummaries(meetingId) {
  const c = tagCounts(meetingId)
  if (!c) return []
  return [
    { tag: '结论', count: c['结论'], class: 'con' },
    { tag: '待定', count: c['待定'], class: 'pen' },
    { tag: '行动项', count: c['行动项'], class: 'act' }
  ].filter(s => s.count > 0)
}

function patchCount(meetingId) {
  return patches.value.filter(p => {
    const r = records.value.find(rr => rr.id === p.targetId)
    return r?.meetingId === meetingId
  }).length
}

function patchesFor(recordId) {
  return patches.value.filter(p => p.targetType === 'record' && p.targetId === recordId)
}

function allTags(r) {
  return [...new Set([...r.autoTags, ...r.manualTags])]
}

function onExpand(id) {
  expanded.value = expanded.value === id ? null : id
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-CN')
}
</script>

<style lang="scss" scoped>
.mw-root { max-width: 780px; margin: 0 auto; }
.mw-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.mw-sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
.empty { color: #94a3b8; text-align: center; padding: 60px 0; }

.mw-timeline { position: relative; padding-left: 32px; }
.mw-timeline::before {
  content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: #e2e8f0;
}
.mw-card { position: relative; margin-bottom: 22px;
  &.has-pending { .mw-body { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.12); } }
}
.mw-dot {
  position: absolute; left: -30px; top: 12px;
  width: 18px; height: 18px; border-radius: 50%; background: #cbd5e1;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  .dot-core { width: 8px; height: 8px; border-radius: 50%; background: #fff; }
  &.latest { background: #6366f1; }
}
.mw-body {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; cursor: pointer; transition: all 0.2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
}
.mw-card-hd {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap;
  h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; word-break: break-word; }
}
.mw-date { font-size: 12px; color: #94a3b8; }
.mw-badges { display: flex; gap: 4px; flex-shrink: 0; }
.mw-tag-strip { display: flex; height: 6px; border-radius: 3px; overflow: hidden; margin: 10px 0; }
.strip-seg { min-width: 4px; }
.mw-summary { display: flex; gap: 12px; margin-top: 4px; font-size: 13px; flex-wrap: wrap;
  .sum-con { color: #10b981; } .sum-pen { color: #f59e0b; } .sum-act { color: #6366f1; }
}
.patch-badge {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
  color: #6366f1; font-size: 12px; font-weight: 600;
}
.mw-record {
  padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9; margin-bottom: 8px;
}
.mwr-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.mwr-seq { font-weight: 700; color: #6366f1; flex-shrink: 0; }
.mwr-time { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.mwr-content { font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.mwr-patch {
  margin-top: 8px; margin-left: 8px; padding: 8px 12px;
  background: #faf5ff; border-radius: 8px; border-left: 3px solid #8b5cf6;
  .patch-author { font-weight: 600; font-size: 12px; margin-left: 6px; }
  .patch-time { font-size: 11px; color: #94a3b8; margin-left: 6px; }
  .patch-content { font-size: 13px; color: #475569; margin-top: 4px; }
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .mw-root { max-width: 100%; }
  .mw-title { font-size: 20px; }
  .mw-timeline { padding-left: 24px; }
  .mw-timeline::before { left: 7px; }
  .mw-dot {
    left: -22px; top: 10px;
    width: 14px; height: 14px;
    .dot-core { width: 6px; height: 6px; }
  }
  .mw-body { padding: 14px; border-radius: 12px; }
  .mw-card { margin-bottom: 16px; }
  .mw-card-hd { flex-direction: column; gap: 6px;
    h3 { font-size: 15px; }
  }
  .mw-badges { align-self: flex-start; }
}

@media (max-width: 480px) {
  .mw-title { font-size: 18px; }
  .mw-sub { margin-bottom: 16px; font-size: 12px; }
  .mw-timeline { padding-left: 18px; }
  .mw-timeline::before { left: 5px; width: 1.5px; }
  .mw-dot {
    left: -18px; width: 12px; height: 12px;
    .dot-core { width: 5px; height: 5px; }
  }
  .mw-body { padding: 12px; border-radius: 10px; }
  .mw-card { margin-bottom: 12px; }
  .mw-card-hd h3 { font-size: 14px; }
  .mwr-content { font-size: 13px; }
  .mwr-patch { margin-left: 4px; padding: 6px 10px; }
}
</style>

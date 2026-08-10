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

<style lang="scss" scoped src="./MemoryWall.scss"></style>

<style lang="scss">
html.dark-mode {
  .mw-title { color: #e2dee9; }
  .mw-sub { color: #64748b; }
  .empty { color: #64748b; }
  .mw-timeline::before { background: linear-gradient(180deg, #a78bfa 0%, #2d2d4a 30%, #2d2d4a 70%, #3a3a5a 100%); }
  .mw-dot {
    background: #3a3a5a; box-shadow: 0 0 0 4px rgba(58,58,90,0.3);
    .dot-core { background: #1e1e2e; }
  }
  .mw-body {
    background: #1e1e2e; border-color: #2d2d4a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.25); border-color: #5b4bcf; }
  }
  .mw-card-hd h3 { color: #e2dee9; }
  .mw-date { color: #64748b; }
  .patch-badge { background: rgba(167, 139, 250, 0.1); color: #a78bfa; }
  .mw-record {
    background: #212136; border-color: #252540;
    &:hover { background: #252540; border-color: #2d2d4a; }
  }
  .mwr-seq { color: #a78bfa; }
  .mwr-time { color: #64748b; }
  .mwr-content { color: #cbd5e1; }
  .mwr-patch {
    background: rgba(167, 139, 250, 0.06); border-left-color: #7c3aed;
    .patch-author { color: #e2dee9; }
    .patch-time { color: #64748b; }
    .patch-content { color: #94a3b8; }
  }
}
</style>

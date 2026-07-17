<template>
  <div class="agenda-board">
    <MeetingSelect v-model="meetingId" />

    <template v-if="meetingId">
    <div class="agenda-cols">
      <!-- 左：议题收集 -->
      <div class="col">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">📝 提交议题（实名制）</span></template>
          <el-form label-position="left" class="agenda-form">
            <el-form-item label="标题">
              <el-input v-model="ag.title" placeholder="议题标题" maxlength="40" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="ag.category">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="ag.desc" type="textarea" :rows="2" placeholder="补充说明" />
            </el-form-item>
            <el-form-item label="议题情绪" class="emotion-item">
              <div class="emotion-row">
                <el-slider
                  v-model="ag.emotion"
                  :show-tooltip="false"
                  :class="`thermo-emo-${emotionRangeVal(ag.emotion)}`"
                  :style="{ '--bar-color': barColor(ag.emotion) }"
                />
                <span class="emo-val" :style="{ color: barColor(ag.emotion) }">
                  <span class="emo-val-icon">{{ emoIcon(ag.emotion) }}</span>
                  <span class="emo-val-num">{{ ag.emotion }}</span>
                </span>
              </div>
            </el-form-item>
            <el-form-item label="优先级">
              <el-rate v-model="ag.priority" :max="5" />
            </el-form-item>
            <div class="form-submit">
              <el-button type="primary" :disabled="!ag.title" @click="onSubmit">提交议题</el-button>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="never" class="block">
          <template #header>
            <div class="block-header">
              <span class="block-title">📋 议程</span>
              <div class="block-header-actions">
                <el-select v-model="sortBy" size="small" class="sort-select">
                  <el-option label="按状态排序" value="status" />
                  <el-option label="按共鸣排序" value="resonance" />
                  <el-option label="按优先级排序" value="priority" />
                  <el-option label="按时间排序" value="time" />
                </el-select>
                <el-button
                  v-if="!meeting.agendaLocked"
                  link type="warning" size="small"
                  @click="onLock"
                >锁定议程</el-button>
                <el-tag v-else size="small" type="info" effect="plain">已锁定</el-tag>
              </div>
            </div>
          </template>

          <div v-if="agenda.length === 0" class="empty">暂无议题，先提交一个吧～</div>
          <div
            v-for="(item, i) in agenda"
            :key="item.id"
            class="agenda-item"
            :class="{ locked: meeting.agendaLocked }"
          >
            <div class="ai-top">
              <div class="ai-order" :class="`ai-order-${item.status}`">{{ i + 1 }}</div>
              <div class="ai-body">
                <div class="ai-head">
                  <span class="ai-title" :class="{ 'ai-title-resolved': item.status === 'resolved' }">{{ item.title }}</span>
                  <el-tag size="small" :type="priType(item.priority)" effect="plain" class="hide-mobile">
                    {{ ['很低', '低', '中', '高', '很高'][item.priority - 1] }}优先
                  </el-tag>
                  <el-tag size="small" type="info" effect="plain" class="hide-mobile">{{ item.category }}</el-tag>
                  <div class="ai-actions-mobile">
                    <el-button
                      size="small"
                      :type="item.resonance.includes(uid) ? 'success' : 'default'"
                      @click="onResonate(item.id)"
                    >
                      <el-icon><CirclePlus /></el-icon> 共鸣 {{ item.resonance.length }}
                    </el-button>
                  </div>
                </div>
                <div class="ai-meta">
                  提交人：<b>{{ name(item.authorId) }}</b>
                  <span v-if="item.emotionLevel != null" class="ai-emo-line">议题情绪 {{ item.emotionLevel }}</span>
                </div>
                <div v-if="item.desc" class="ai-desc">{{ item.desc }}</div>
                <div v-if="item.resolution" class="ai-resolution">
                  <span class="ai-resolution-icon">📋</span> {{ item.resolution }}
                </div>
              </div>
              <div class="ai-actions">
                <el-button
                  size="small"
                  :type="item.resonance.includes(uid) ? 'success' : 'default'"
                  @click="onResonate(item.id)"
                >
                  <el-icon><CirclePlus /></el-icon> 共鸣 {{ item.resonance.length }}
                </el-button>
              </div>
            </div>
            <div class="ai-bottom">
              <div class="ai-status-bar">
                <span class="ai-status-label">状态：</span>
                <span
                  class="ai-status-btn"
                  :class="{ active: item.status === 'pending' }"
                  @click="onStatus(item.id, 'pending')"
                >
                  <span class="ai-status-text">待讨论</span>
                </span>
                <span class="ai-status-sep">→</span>
                <span
                  class="ai-status-btn"
                  :class="{ active: item.status === 'discussing' }"
                  @click="onStatus(item.id, 'discussing')"
                >
                  <span class="ai-status-text">讨论中</span>
                </span>
                <span class="ai-status-sep">→</span>
                <span
                  class="ai-status-btn"
                  :class="{ active: item.status === 'resolved' }"
                  @click="onStatus(item.id, 'resolved')"
                >
                  <span class="ai-status-text">已决议</span>
                </span>
              </div>
              <div v-if="item.authorId === uid || isAdmin" class="ai-bottom-actions">
                <el-button size="small" link type="primary" @click="openEdit(item)">编辑</el-button>
                <el-popconfirm title="删除该议题？" @confirm="onRemove(item.id)">
                  <template #reference>
                    <el-button size="small" link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 编辑议题弹窗 -->
        <el-dialog v-model="editVisible" title="编辑议题" width="480px" destroy-on-close>
          <el-form label-position="top">
            <el-form-item label="标题">
              <el-input v-model="editForm.title" maxlength="40" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="editForm.category">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="editForm.desc" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="议题情绪">
              <div class="emotion-row">
                <el-slider v-model="editForm.emotionLevel" :show-tooltip="false" :style="{ '--bar-color': barColor(editForm.emotionLevel) }" />
                <span class="emo-val" :style="{ color: barColor(editForm.emotionLevel) }">
                  <span class="emo-val-icon">{{ emoIcon(editForm.emotionLevel) }}</span>
                  <span class="emo-val-num">{{ editForm.emotionLevel }}</span>
                </span>
              </div>
            </el-form-item>
            <el-form-item label="优先级">
              <el-rate v-model="editForm.priority" :max="5" />
            </el-form-item>
            <el-form-item label="会议决议">
              <el-input v-model="editForm.resolution" type="textarea" :rows="2" placeholder="会议达成的决议或结论（可选）" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="editVisible = false">取消</el-button>
            <el-button type="primary" :disabled="!editForm.title" @click="saveEdit">保存</el-button>
          </template>
        </el-dialog>
      </div>

      <!-- 右：情绪温度计 + 家庭情绪总览 -->
      <div class="col">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">🌡️ 情绪温度计</span></template>
          <p class="hint">滑动记录你此刻的情绪（0=低落，100=愉悦），自动保存并用于年度报告。</p>
          <div class="thermo">
            <el-slider
              v-model="emotionLevel"
              :show-tooltip="false"
              :class="`thermo-emo-${emotionRange}`"
              :style="{ '--bar-color': emoColor }"
            />
            <div class="thermo-val" :style="{ color: emoColor }">
              <span class="emo-icon">{{ emoIcon(emotionLevel) }}</span>
              <span class="tv-num">{{ emotionLevel }}</span>
            </div>
          </div>
          <el-input v-model="emotionNote" type="textarea" :rows="2" placeholder="今天为什么是这个情绪？（可选）" class="emo-note" />
          <div class="emo-save-row">
            <button class="emo-save-btn" :disabled="saving || emotionCooldown" @click="saveEmotion">
              {{ emotionCooldown ? '已保存' : '保存心情' }}
            </button>
          </div>

          <!-- 我的情绪时间线 -->
          <div v-if="myEmotionTimeline.length > 0" class="emotion-timeline">
            <div class="fe-title">📝 我的情绪日记</div>
            <div class="et-list">
              <div v-for="e in myEmotionTimeline" :key="e.id" class="et-item">
              <div class="et-bar" :style="{ background: barColor(e.level) }"></div>
              <span class="et-emoji">{{ emoIcon(e.level) }}</span>
              <div class="et-body">
                <div class="et-top-row">
                  <span class="et-time">{{ formatTime(e.timestamp || e.createdAt) }}</span>
                  <span class="et-level" :style="{ color: barColor(e.level) }">{{ e.level }}</span>
                </div>
                <div v-if="e.note" class="et-note">{{ e.note }}</div>
                <div v-else class="et-note et-note-empty">记录了一份心情</div>
              </div>
            </div>
            </div>
          </div>

          <!-- 家庭情绪总览 -->
          <div class="family-emotion">
            <div class="fe-title">💚 家庭情绪总览</div>
            <div v-for="m in lowMoodMembers" :key="'care-' + m.id" class="fe-care">
              {{ emoIcon(m.level) }} {{ m.name }}今天心情好像不太好，去关心一下吧～
            </div>
            <div v-for="m in members" :key="m.id" class="fe-row" :class="{ 'fe-low': memberEmotionLevel(m.id) < 50 }">
              <span class="fe-name">{{ m.name }}</span>
              <div class="fe-bar-wrap">
                <div
                  class="fe-bar"
                  :style="{ width: memberEmotionLevel(m.id) + '%', background: barColor(memberEmotionLevel(m.id)) }"
                ></div>
              </div>
              <span class="fe-val" :style="{ color: barColor(memberEmotionLevel(m.id)) }">
                <span class="fe-emoji">{{ emoIcon(memberEmotionLevel(m.id)) }}</span>
                {{ memberEmotionLevel(m.id) }}
              </span>
            </div>
            <div v-if="members.length === 0" class="empty small">暂无家庭成员</div>
            <div v-else-if="!hasEmotion" class="empty small">滑动上方滑块记录第一份情绪吧</div>
          </div>
        </el-card>
      </div>
    </div>
    </template>

    <el-empty v-else description="请先选择或新建一个会议" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { CirclePlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MeetingSelect from './MeetingSelect.vue'

const store = useStore()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')

const categories = ['家庭事务', '财务', '子女教育', '健康', '出行计划', '情感沟通', '其他']
const ag = ref({ title: '', category: '家庭事务', priority: 3, desc: '', emotion: 50 })
const emotionLevel = ref(50)
const emotionNote = ref('')
const saving = ref(false)
const emotionCooldown = ref(false)
// 排序
const sortBy = ref('status')
// 编辑状态
const editVisible = ref(false)
const editId = ref(null)
const editForm = ref({ title: '', category: '家庭事务', priority: 3, desc: '', emotionLevel: 50, resolution: '' })

const uid = computed(() => store.state.familyMeeting.currentUserId)
const isAdmin = computed(() => store.getters['familyMeeting/isAdmin'])
const meeting = computed(() => store.getters['familyMeeting/meetingById'](meetingId.value) || {})
const agenda = computed(() => {
  const raw = store.getters['familyMeeting/agendaForMeeting'](meetingId.value)
  const items = [...raw]
  if (sortBy.value === 'status') {
    const order = { pending: 0, discussing: 1, resolved: 2 }
    items.sort((a, b) => (order[a.status] ?? 0) - (order[b.status] ?? 0) || b.priority - a.priority)
  } else if (sortBy.value === 'priority') {
    items.sort((a, b) => b.priority - a.priority || new Date(a.createdAt) - new Date(b.createdAt))
  } else if (sortBy.value === 'time') {
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }
  // resonance 保持 store 排序
  return items
})
const members = computed(() => store.state.familyMeeting.members)
const emotionLogs = computed(() => store.getters['familyMeeting/emotionForMeeting'](meetingId.value))
const hasEmotion = computed(() => emotionLogs.value.length > 0)

// 我的情绪时间线（全量，倒序）
const myEmotionTimeline = computed(() => {
  return emotionLogs.value
    .filter(e => e.userId === uid.value)
    .reverse()
})

// 情绪偏低的成员（低于50提示关怀）
const lowMoodMembers = computed(() => {
  return members.value
    .map(m => ({ ...m, level: memberEmotionLevel(m.id) }))
    .filter(m => m.level < 50)
})

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emoColor = computed(() => {
  const v = emotionLevel.value
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
})
const emotionRange = computed(() => {
  const v = emotionLevel.value
  if (v >= 80) return 'excited'
  if (v >= 60) return 'happy'
  if (v >= 40) return 'ok'
  if (v >= 20) return 'worried'
  return 'sad'
})

function name(id) { return store.getters['familyMeeting/memberName'](id) }
function priType(p) { return ['info', 'info', '', 'warning', 'danger'][p - 1] }
function statusLabel(s) {
  const map = { pending: '待讨论', discussing: '讨论中', resolved: '已决议' }
  return map[s] || '待讨论'
}
function statusType(s) {
  const map = { pending: 'info', discussing: 'warning', resolved: 'success' }
  return map[s] || 'info'
}
function barColor(v) {
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  if (v > 0) return '#ef4444'
  return '#cbd5e1'
}
function emoIcon(v) {
  if (v >= 80) return '🥳'
  if (v >= 60) return '😄'
  if (v >= 40) return '🙂'
  if (v >= 20) return '😟'
  return '😢'
}
function emotionRangeVal(v) {
  if (v >= 80) return 'excited'
  if (v >= 60) return 'happy'
  if (v >= 40) return 'ok'
  if (v >= 20) return 'worried'
  return 'sad'
}

// 各成员最新温度计读数（代表"此刻心情"）
function memberEmotionLevel(memberId) {
  const logs = store.getters['familyMeeting/emotionByUser'](memberId)
    .filter(e => e.meetingId === meetingId.value)
  if (!logs.length) return 50
  return logs[logs.length - 1].level
}

function onSubmit() {
  if (!ag.value.title) return
  store.dispatch('familyMeeting/addAgenda', {
    meetingId: meetingId.value,
    title: ag.value.title,
    category: ag.value.category,
    priority: ag.value.priority,
    desc: ag.value.desc,
    emotionLevel: ag.value.emotion
  })
  ag.value = { title: '', category: '家庭事务', priority: 3, desc: '', emotion: 50 }
  ElMessage.success('议题已提交')
}

function onResonate(id) { store.dispatch('familyMeeting/toggleResonance', id) }
function onRemove(id) { store.dispatch('familyMeeting/removeAgenda', id) }
function onLock() { store.dispatch('familyMeeting/lockAgenda', meetingId.value); ElMessage.success('议程已锁定') }
function onStatus(id, status) {
  store.dispatch('familyMeeting/updateAgenda', { id, patch: { status } })
}

function openEdit(item) {
  editId.value = item.id
  editForm.value = {
    title: item.title,
    category: item.category || '家庭事务',
    priority: item.priority || 3,
    desc: item.desc || '',
    emotionLevel: item.emotionLevel ?? 50,
    resolution: item.resolution || ''
  }
  editVisible.value = true
}

function saveEdit() {
  if (!editForm.value.title) return
  store.dispatch('familyMeeting/updateAgenda', {
    id: editId.value,
    patch: { ...editForm.value }
  })
  editVisible.value = false
  ElMessage.success('议题已更新')
}

// 手动保存情绪（30秒冷却防重复）
async function saveEmotion() {
  if (!meetingId.value || emotionCooldown.value) return
  emotionCooldown.value = true
  saving.value = true
  try {
    await store.dispatch('familyMeeting/addEmotion', {
      userId: uid.value,
      meetingId: meetingId.value,
      level: emotionLevel.value,
      note: emotionNote.value
    })
    ElMessage.success('心情已保存')
    emotionNote.value = ''
  } catch {
    ElMessage.error('保存失败')
    emotionCooldown.value = false
  } finally {
    saving.value = false
    setTimeout(() => { emotionCooldown.value = false }, 30000)
  }
}
</script>

<style lang="scss" scoped>
.agenda-board { display: flex; flex-direction: column; gap: 16px; }
.agenda-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
.col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.block {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) { padding: 18px 20px 20px; }
}
.block-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.block-header-actions { display: flex; align-items: center; gap: 10px; }
.sort-select { width: 130px; }
.block-title { font-weight: 700; color: #0f172a; font-size: 15px; letter-spacing: 0.01em; white-space: nowrap; }
.hint { font-size: 13px; color: #94a3b8; margin: 0 0 14px; line-height: 1.6; }
.empty { color: #94a3b8; text-align: center; padding: 32px 0; font-size: 14px; &.small { padding: 12px 0; font-size: 13px; } }
.agenda-item {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 16px; border: 1px solid #e8ecf4;
  border-radius: 14px; margin-bottom: 10px; background: #fff;
  transition: all 0.2s;
  &:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(99,102,241,0.06); }
  &.locked { opacity: 0.8; background: #fafbfd; }
  &:last-child { margin-bottom: 0; }
}
.ai-top { display: flex; gap: 12px; }
.ai-bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.ai-order {
  width: 28px; height: 28px; min-width: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
  transition: all 0.3s;
  &.ai-order-discussing { background: linear-gradient(135deg, #f59e0b, #d97706); }
  &.ai-order-resolved { background: linear-gradient(135deg, #10b981, #059669); }
}
.ai-body { flex: 1; min-width: 0; }
.ai-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ai-title { font-weight: 700; color: #0f172a; font-size: 14px; transition: all 0.2s; }
.ai-title-resolved { text-decoration: line-through; color: #94a3b8; }
.ai-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ai-emo-line { font-size: 12px; color: #f59e0b; font-weight: 600; margin-left: 8px; }
.ai-desc { font-size: 13px; color: #475569; margin-top: 6px; word-break: break-word; line-height: 1.5; }
.ai-resolution {
  font-size: 13px; color: #10b981; margin-top: 6px;
  background: #ecfdf5; padding: 6px 10px; border-radius: 8px;
  display: flex; align-items: flex-start; gap: 4px; line-height: 1.5;
}
.ai-resolution-icon { flex-shrink: 0; }
.ai-actions {
  display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0;
}
.ai-actions-mobile { display: none; }

// 共鸣按钮
.ai-actions :deep(.el-button--default),
.ai-actions-mobile :deep(.el-button--default) {
  background: #f1f5f9; border-color: #e2e8f0; color: #475569;
  &:hover { background: #e0e7ff; border-color: #c7d2fe; color: #4338ca; }
}

// 状态流转条
.ai-status-bar {
  display: flex; align-items: center; gap: 0; flex-wrap: wrap;
  font-size: 12px;
}
.ai-status-label { color: #94a3b8; font-size: 12px; margin-right: 6px; }
.ai-status-btn {
  padding: 3px 10px; border-radius: 14px;
  cursor: pointer; transition: all 0.2s;
  color: #94a3b8; background: #f1f5f9;
  user-select: none; white-space: nowrap;
  display: inline-flex; align-items: center; gap: 3px;
  &:hover { color: #6366f1; background: #eef2ff; }
  &.active {
    color: #fff; font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 2px 8px rgba(99,102,241,0.25);
    &:has(+ .ai-status-sep) { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 2px 8px rgba(245,158,11,0.25); }
  }
  &.active:last-child { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 2px 8px rgba(16,185,129,0.25); }
}
.ai-status-sep {
  color: #cbd5e1; font-size: 11px; padding: 0 3px;
}
.ai-status-icon { font-size: 12px; }
.ai-bottom-actions {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.thermo {
  display: flex; align-items: center; gap: 16px;
  margin: 8px 0 14px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 14px;
}
.thermo-val {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 28px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: color 0.3s;
  flex-shrink: 0;
}
.tv-num { font-size: 16px; line-height: 1.2; }
.emo-val {
  margin-left: 10px; font-weight: 700; font-size: 14px;
  display: flex; flex-direction: column; align-items: center;
}
.emo-val-icon { font-size: 24px; line-height: 1.1; }
.emo-val-num { font-size: 13px; line-height: 1.2; }

// 情绪保存
.emo-note { margin-bottom: 0; }
.emo-save-row {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-top: 10px;
}
.emo-save-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 18px;
  border: none; border-radius: 20px;
  font-size: 14px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 2px 10px rgba(99,102,241,0.25);
  cursor: pointer; transition: all 0.2s;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.35); }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
}
// 家庭情绪总览 - 水平条形图
.family-emotion {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
}
.fe-title { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 14px; }
.fe-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
}
.fe-name {
  width: 56px; flex-shrink: 0;
  font-size: 13px; font-weight: 600; color: #475569;
  text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fe-bar-wrap {
  flex: 1; height: 8px; border-radius: 4px;
  background: #e8ecf4; overflow: hidden;
}
.fe-bar {
  height: 100%; border-radius: 4px;
  min-width: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fe-val {
  width: 56px; flex-shrink: 0; text-align: center;
  font-size: 13px; font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: flex; align-items: center; gap: 2px; justify-content: center;
}
.fe-emoji { font-size: 16px; line-height: 1; }
.emo-icon { font-size: 26px; line-height: 1; }

// 情绪日记时间线
.emotion-timeline {
  margin-top: 18px; padding-top: 14px; border-top: 1px solid #f1f5f9;
}
.et-list {
  max-height: 260px; overflow-y: auto;
}
.et-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 0; position: relative;
  & + .et-item { border-top: 1px dashed #e8ecf4; }
}
.et-bar {
  width: 4px; min-width: 4px; border-radius: 2px;
  align-self: stretch; opacity: 0.6;
}
.et-emoji { font-size: 22px; line-height: 1; flex-shrink: 0; }
.et-body { flex: 1; min-width: 0; }
.et-top-row {
  display: flex; align-items: baseline; gap: 8px;
}
.et-time { font-size: 12px; color: #94a3b8; }
.et-level { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.et-note {
  font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.4;
  word-break: break-word;
}
.et-note-empty { color: #cbd5e1; font-style: italic; }

// 滑块圆钮：用表情图标替代默认蓝色圆圈
:deep(.el-slider__button) {
  width: 28px;
  height: 28px;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  &::before {
    content: '🙂';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 22px;
    line-height: 1;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
    transition: transform 0.15s;
  }
  &:hover::before,
  &:active::before {
    transform: translate(-50%, -50%) scale(1.2);
  }
  // 拖拽状态也放大
  &[aria-valuenow]::before {
    // fallback
  }
}
:deep(.el-slider__button:hover),
:deep(.el-slider__button:active) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.thermo-emo-excited :deep(.el-slider__button)::before { content: '🥳'; }
.thermo-emo-happy :deep(.el-slider__button)::before { content: '😄'; }
.thermo-emo-ok :deep(.el-slider__button)::before { content: '🙂'; }
.thermo-emo-worried :deep(.el-slider__button)::before { content: '😟'; }
.thermo-emo-sad :deep(.el-slider__button)::before { content: '😢'; }

// 进度条颜色随心情变化
:deep(.el-slider__bar) {
  background: var(--bar-color) !important;
  transition: background 0.3s;
}


// ===== 提交表单：label 与输入框同行 =====
.agenda-form :deep(.el-form-item) {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.agenda-form :deep(.el-form-item__label) {
  flex-shrink: 0;
  width: 72px;
  padding-right: 12px;
  text-align: right;
  line-height: 32px;
  margin-bottom: 0;
  white-space: nowrap;
}
.agenda-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  line-height: 32px;
}

// 表单行：分类 + 优先级并排，各自独立 form-item
.form-row :deep(.el-form-item) {
  flex-wrap: nowrap;
}
.form-row :deep(.el-form-item__label) {
  width: 62px;
}
.form-row :deep(.el-select) {
  width: 100%;
}

// 议题情绪行
.emotion-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  .el-slider { flex: 1; }
}

// 提交按钮右对齐
.form-submit {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

// ===== 响应式 =====
@media (max-width: 1024px) {
  .agenda-cols { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .agenda-cols { grid-template-columns: 1fr; gap: 14px; }
  .agenda-item {
    .ai-top { flex-direction: row; gap: 10px; align-items: flex-start; }
    .ai-actions { display: none; }
    .ai-actions-mobile { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-left: auto; }
    .ai-body { min-width: 0; }
    .ai-head { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }
  }
  .hide-mobile { display: none !important; }
  .ai-bottom { flex-direction: row; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ai-bottom-actions { margin-left: auto; flex-shrink: 0; }
  .ai-status-label { font-size: 11px; margin-right: 2px; }
  .thermo-val { font-size: 24px; }
  .block :deep(.el-card__body) { padding: 14px 16px 16px; }
  .block :deep(.el-card__header) { padding: 14px 16px; }
  .block-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .block-header-actions { width: 100%; flex-wrap: wrap; }
  .sort-select { flex: 1; min-width: 100px; }
  .ai-status-btn { font-size: 11px; padding: 3px 8px; }
  .ai-status-sep { padding: 0 1px; font-size: 10px; }
  // 小屏下 label 回到上方
  .agenda-form :deep(.el-form-item) {
    flex-direction: column;
    align-items: stretch;
  }
  .agenda-form :deep(.el-form-item__label) {
    width: auto;
    text-align: left;
    padding-right: 0;
    line-height: 1.5;
    margin-bottom: 4px;
    font-size: 13px;
  }
  .form-row :deep(.el-col) {
    max-width: 100% !important;
    flex: 0 0 100% !important;
    margin-bottom: 0;
  }
  .et-list { max-height: 200px; }
}

@media (max-width: 480px) {
  .agenda-board { gap: 12px; }
  .col { gap: 12px; }
  .agenda-item { padding: 12px; border-radius: 12px; }
  .block { border-radius: 14px; }
  .ai-head { gap: 4px; }
  .ai-title { font-size: 14px; }
  .ai-order { width: 24px; height: 24px; min-width: 24px; font-size: 12px; }
  .ai-meta { font-size: 11px; }
  .ai-emo-line { font-size: 11px; }
  .ai-desc { font-size: 12px; }
  .ai-resolution { font-size: 12px; padding: 5px 8px; }
  .thermo { padding: 12px; gap: 12px; }
  .thermo-val { font-size: 22px; }
  .fe-name { width: 44px; font-size: 12px; }
  .fe-val { font-size: 12px; }
  .ai-status-btn { font-size: 10px; padding: 2px 6px; gap: 2px; }
  .ai-status-icon { font-size: 11px; }
  .ai-status-sep { padding: 0 1px; font-size: 9px; }
  .ai-status-label { font-size: 10px; margin-right: 1px; }
  .ai-bottom-actions { gap: 2px; margin-left: auto; .el-button { font-size: 12px; } }
  .emo-save-btn { font-size: 13px; padding: 6px 14px; }
  .et-emoji { font-size: 18px; }
  .et-level { font-size: 13px; }
  .et-list { max-height: 180px; }
  .fe-care { font-size: 12px; padding: 6px 10px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .block {
    background: #1e1e2e; border-color: #2d2d4a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .el-card__header { border-bottom-color: #252540; background: #212136; }
    .el-card__body { background: #1e1e2e; }
  }
  .block-title { color: #e2dee9; }
  .hint { color: #64748b; }
  .empty { color: #64748b; }
  .agenda-item {
    background: #252540; border-color: #2d2d4a;
    &:hover { border-color: #5b4bcf; box-shadow: 0 2px 12px rgba(99,102,241,0.12); }
    &.locked { opacity: 0.8; background: #212136; }
  }
  .ai-title { color: #e2dee9; }
  .ai-title-resolved { color: #64748b; }
  .ai-meta { color: #64748b; b { color: #94a3b8; } }
  .ai-desc { color: #94a3b8; }
  .ai-emo-line { color: #fbbf24; }
  .ai-resolution { color: #34d399; background: #1a2e24; }
  .thermo { background: #252540; }
  .thermo-val { text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  .agenda-form :deep(.el-form-item__label) { color: #94a3b8; }
  .family-emotion { border-top-color: #252540; }
  .fe-title { color: #94a3b8; }
  .fe-name { color: #94a3b8; }
  .fe-bar-wrap { background: #2d2d4a; }
  .fe-care { color: #fbbf24; background: #2a2418; }
  .fe-row.fe-low { background: #2a1e1e; }

  // 共鸣按钮（暗色）
  .ai-actions .el-button--default,
  .ai-actions-mobile .el-button--default {
    background: #2d2d4a !important; border-color: #3d3d5c !important; color: #c4b5fd !important;
    &:hover { background: #2a2448 !important; border-color: #4b3d8a !important; color: #ddd6fe !important; }
  }
  .ai-actions .el-button--success,
  .ai-actions-mobile .el-button--success {
    background: #1a3a2a !important; border-color: #2d5a3d !important; color: #34d399 !important;
  }

  // 状态流转条
  .ai-status-btn { color: #64748b; background: #2d2d4a; }
  .ai-status-btn:hover { color: #a78bfa; background: #2a2448; }
  .ai-status-btn.active {
    color: #fff;
    &.active:last-child { box-shadow: 0 2px 8px rgba(52,211,153,0.3); }
  }
  .ai-status-sep { color: #4b5563; }

  // 情绪日记
  .emotion-timeline { border-top-color: #252540; }
  .et-item + .et-item { border-top-color: #2d2d4a; }
  .et-time { color: #64748b; }
  .et-note { color: #94a3b8; }
  .et-note-empty { color: #4b5563; }

  // 保存按钮
  .emo-save-btn {
    box-shadow: 0 2px 10px rgba(99,102,241,0.2);
    &:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
  }

  // 滑块
  .thermo-emo-excited :deep(.el-slider__button)::before { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
  .thermo-emo-happy :deep(.el-slider__button)::before { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
  .thermo-emo-ok :deep(.el-slider__button)::before { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
  .thermo-emo-worried :deep(.el-slider__button)::before { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
  .thermo-emo-sad :deep(.el-slider__button)::before { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
}
</style>

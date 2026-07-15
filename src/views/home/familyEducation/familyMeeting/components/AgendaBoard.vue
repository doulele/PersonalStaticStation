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
            <el-row :gutter="16" class="form-row">
              <el-col :span="12">
                <el-form-item label="分类">
                  <el-select v-model="ag.category">
                    <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-rate v-model="ag.priority" :max="3" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="描述">
              <el-input v-model="ag.desc" type="textarea" :rows="2" placeholder="补充说明" />
            </el-form-item>
            <el-form-item label="关联情绪" class="emotion-item">
              <div class="emotion-row">
                <el-slider v-model="ag.emotion" :show-tooltip="false" />
                <span class="emo-val">{{ ag.emotion }}</span>
              </div>
            </el-form-item>
            <div class="form-submit">
              <el-button type="primary" :disabled="!ag.title" @click="onSubmit">提交议题</el-button>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="never" class="block">
          <template #header>
            <span class="block-title">📋 议程（按共鸣数与紧急度自动排序）</span>
            <el-button
              v-if="!meeting.agendaLocked"
              link type="warning" size="small"
              @click="onLock"
            >锁定议程</el-button>
            <el-tag v-else size="small" type="info" effect="plain">已锁定</el-tag>
          </template>

          <div v-if="agenda.length === 0" class="empty">暂无议题，先提交一个吧～</div>
          <div
            v-for="(item, i) in agenda"
            :key="item.id"
            class="agenda-item"
            :class="{ locked: meeting.agendaLocked }"
          >
            <div class="ai-order">{{ i + 1 }}</div>
            <div class="ai-body">
              <div class="ai-head">
                <span class="ai-title">{{ item.title }}</span>
                <el-tag size="small" :type="priType(item.priority)" effect="plain">
                  {{ ['低', '中', '高'][item.priority - 1] }}优先
                </el-tag>
                <el-tag size="small" type="info" effect="plain">{{ item.category }}</el-tag>
              </div>
              <div class="ai-meta">
                提交人：<b>{{ name(item.authorId) }}</b>
                <span v-if="item.emotionLevel != null" class="ai-emo">情绪 {{ item.emotionLevel }}</span>
              </div>
              <div v-if="item.desc" class="ai-desc">{{ item.desc }}</div>
            </div>
            <div class="ai-actions">
              <el-button
                size="small"
                :type="item.resonance.includes(uid) ? 'success' : 'default'"
                @click="onResonate(item.id)"
              >
                <el-icon><CirclePlus /></el-icon> 共鸣 {{ item.resonance.length }}
              </el-button>
              <el-popconfirm title="删除该议题？" @confirm="onRemove(item.id)">
                <template #reference>
                  <el-button size="small" link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右：情绪温度计 + 家庭情绪总览 -->
      <div class="col">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">🌡️ 情绪温度计</span></template>
          <p class="hint">滑动记录你此刻的情绪（0=低落，100=愉悦），自动保存并用于年度报告。</p>
          <div class="thermo">
            <el-slider v-model="emotionLevel" :show-tooltip="false" />
            <div class="thermo-val" :style="{ color: emoColor }">{{ emotionLevel }}</div>
          </div>
          <el-input v-model="emotionNote" type="textarea" :rows="2" placeholder="今天为什么是这个情绪？（可选，自动保存）" class="emo-note" />
          <div v-if="saving" class="emo-status">⏳ 自动保存中…</div>
          <div v-else-if="saved" class="emo-status saved">✓ 已自动保存</div>

          <!-- 家庭情绪总览 -->
          <div class="family-emotion">
            <div class="fe-title">家庭情绪总览</div>
            <div v-for="m in members" :key="m.id" class="fe-row">
              <span class="fe-name">{{ m.name }}</span>
              <div class="fe-bar-wrap">
                <div
                  class="fe-bar"
                  :style="{ width: memberEmotionLevel(m.id) + '%', background: barColor(memberEmotionLevel(m.id)) }"
                ></div>
              </div>
              <span class="fe-val" :style="{ color: barColor(memberEmotionLevel(m.id)) }">
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
import { ref, computed, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { CirclePlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MeetingSelect from './MeetingSelect.vue'

const store = useStore()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')

const categories = ['家庭事务', '财务', '子女教育', '健康', '出行计划', '情感沟通', '其他']
const ag = ref({ title: '', category: '家庭事务', priority: 2, desc: '', emotion: 50 })
const emotionLevel = ref(50)
const emotionNote = ref('')
const saving = ref(false)
const saved = ref(false)
let saveTimer = null

const uid = computed(() => store.state.familyMeeting.currentUserId)
const meeting = computed(() => store.getters['familyMeeting/meetingById'](meetingId.value) || {})
const agenda = computed(() => store.getters['familyMeeting/agendaForMeeting'](meetingId.value))
const members = computed(() => store.state.familyMeeting.members)
const emotionLogs = computed(() => store.getters['familyMeeting/emotionForMeeting'](meetingId.value))
const hasEmotion = computed(() => emotionLogs.value.length > 0)

const emoColor = computed(() => {
  const v = emotionLevel.value
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
})

function name(id) { return store.getters['familyMeeting/memberName'](id) }
function priType(p) { return ['info', 'warning', 'danger'][p - 1] }
function barColor(v) {
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  if (v > 0) return '#ef4444'
  return '#cbd5e1'
}

// 各成员最近一次情绪值
function memberEmotionLevel(memberId) {
  const logs = store.getters['familyMeeting/emotionByUser'](memberId)
    .filter(e => e.meetingId === meetingId.value)
  if (!logs.length) return 0
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
  ag.value = { title: '', category: '家庭事务', priority: 2, desc: '', emotion: 50 }
  ElMessage.success('议题已提交')
}

function onResonate(id) { store.dispatch('familyMeeting/toggleResonance', id) }
function onRemove(id) { store.dispatch('familyMeeting/removeAgenda', id) }
function onLock() { store.dispatch('familyMeeting/lockAgenda', meetingId.value); ElMessage.success('议程已锁定') }

// 防抖自动保存情绪
let debounceTimer = null
function saveEmotion() {
  store.dispatch('familyMeeting/addEmotion', {
    userId: uid.value,
    meetingId: meetingId.value,
    level: emotionLevel.value,
    note: emotionNote.value
  })
  saving.value = false
  saved.value = true
  saveTimer = setTimeout(() => { saved.value = false }, 3000)
}

watch(emotionLevel, () => {
  if (!meetingId.value) return
  saving.value = true
  saved.value = false
  clearTimeout(debounceTimer)
  clearTimeout(saveTimer)
  debounceTimer = setTimeout(saveEmotion, 1500)
})

// 备注变化也触发保存
watch(emotionNote, () => {
  if (!meetingId.value) return
  saving.value = true
  saved.value = false
  clearTimeout(debounceTimer)
  clearTimeout(saveTimer)
  debounceTimer = setTimeout(saveEmotion, 1500)
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
  clearTimeout(saveTimer)
})
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
.block-title { font-weight: 700; color: #0f172a; font-size: 15px; letter-spacing: 0.01em; }
.hint { font-size: 13px; color: #94a3b8; margin: 0 0 14px; line-height: 1.6; }
.empty { color: #94a3b8; text-align: center; padding: 32px 0; font-size: 14px; &.small { padding: 12px 0; font-size: 13px; } }
.agenda-item {
  display: flex; gap: 12px; padding: 14px 16px; border: 1px solid #e8ecf4;
  border-radius: 14px; margin-bottom: 10px; background: #fff;
  transition: all 0.2s;
  &:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(99,102,241,0.06); }
  &.locked { opacity: 0.8; background: #fafbfd; }
  &:last-child { margin-bottom: 0; }
}
.ai-order {
  width: 28px; height: 28px; min-width: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(99,102,241,0.25);
}
.ai-body { flex: 1; min-width: 0; }
.ai-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ai-title { font-weight: 700; color: #0f172a; font-size: 14px; }
.ai-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ai-emo { margin-left: 4px; color: #f59e0b; font-weight: 600; }
.ai-desc { font-size: 13px; color: #475569; margin-top: 6px; word-break: break-word; line-height: 1.5; }
.ai-actions {
  display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0;
}
.thermo {
  display: flex; align-items: center; gap: 24px; justify-content: center;
  margin: 8px 0 14px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 14px;
}
.thermo-val {
  font-size: 44px; font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: color 0.3s;
}
.emo-val { margin-left: 10px; font-weight: 700; color: #6366f1; font-size: 14px; }

// 情绪自动保存状态
.emo-note { margin-bottom: 0; }
.emo-status {
  font-size: 12px; color: #94a3b8; padding-top: 2px;
  &.saved { color: #10b981; font-weight: 500; }
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
  width: 32px; flex-shrink: 0; text-align: center;
  font-size: 13px; font-weight: 700;
  font-variant-numeric: tabular-nums;
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

// 关联情绪行
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
    flex-direction: column; gap: 8px;
    .ai-actions { flex-direction: row; align-items: center; gap: 8px; }
  }
  .thermo-val { font-size: 36px; }
  .block :deep(.el-card__body) { padding: 14px 16px 16px; }
  .block :deep(.el-card__header) { padding: 14px 16px; }
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
}

@media (max-width: 480px) {
  .agenda-board { gap: 12px; }
  .col { gap: 12px; }
  .agenda-item { padding: 12px; border-radius: 12px; }
  .block { border-radius: 14px; }
  .ai-head { gap: 4px; }
  .thermo { padding: 12px; gap: 16px; }
  .thermo-val { font-size: 32px; }
  .fe-name { width: 44px; font-size: 12px; }
  .fe-val { font-size: 12px; }
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
  .ai-meta { color: #64748b; }
  .ai-desc { color: #94a3b8; }
  .thermo { background: #252540; }
  .thermo-val { text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
  .agenda-form .el-form-item__label { color: #94a3b8; }
  .emo-val { color: #a78bfa; }
  .emo-status { color: #64748b; &.saved { color: #34d399; } }
  .family-emotion { border-top-color: #252540; }
  .fe-title { color: #94a3b8; }
  .fe-name { color: #94a3b8; }
  .fe-bar-wrap { background: #2d2d4a; }
}
</style>

<template>
  <div class="mr-root">
    <MeetingSelect v-model="meetingId" />
    <template v-if="meetingId">

    <!-- 控制栏：状态 + 模式切换 + 输入 -->
    <el-card shadow="never" class="mr-ctrl">
      <template #header>
        <div class="ctrl-top">
          <div class="ctrl-title-row">
            <div class="ctrl-title-area">
              <span class="ctrl-title">{{ meeting?.title || '未命名会议' }}</span>
              <span class="status-text" :class="'status-' + (meeting?.status || 'pre')">{{ statusText }}</span>
            </div>
            <div class="ctrl-actions">
              <el-button v-if="meeting?.status === 'pre'" type="success" @click="onStart">开始会议</el-button>
              <el-button v-if="meeting?.status === 'active'" type="danger" @click="onClose">结束会议</el-button>
            </div>
          </div>
          <div class="ctrl-sub-row">
            <el-tag size="small" effect="plain" type="info">参与者：{{ ptNames }}</el-tag>
          </div>
        </div>
      </template>

      <!-- 会议进行中的输入区 -->
      <div v-if="meeting?.status === 'active'" class="ctrl-input">
        <!-- 模式切换 -->
        <div class="mode-switch">
          <div class="mode-tab" :class="{ active: mode === 'text' }" @click="switchToText">
            <span class="mode-label">文本记录</span>
          </div>
          <div class="mode-tab" :class="{ active: mode === 'record' }" @click="mode = 'record'">
            <span class="mode-label">语音录音</span>
          </div>
        </div>

        <!-- ==================== 文本模式 ==================== -->
        <div v-if="mode === 'text'" class="text-panel">
          <div class="text-body">
            <div class="text-speaker-select">
              <span class="input-label">发言人</span>
              <el-select v-model="textSpeaker" size="default" style="width:140px" placeholder="选择发言人">
                <el-option v-for="m in members" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
              <el-tag v-if="textSource === 'ai'" size="small" type="warning" effect="dark">🎙️ 录音转录</el-tag>
            </div>
            <el-input
              v-model="textInput"
              type="textarea"
              :rows="3"
              placeholder="记录会议发言内容…&#10;支持自动识别「结论」「待定」「行动项」等标签"
              class="text-textarea"
              @keyup.enter.ctrl="onSaveText"
            />
            <div class="text-footer">
              <span class="text-hint">Ctrl + Enter 快捷保存</span>
              <el-button type="primary" size="default" @click="onSaveText" :disabled="!textInput.trim()" round>
                保存记录
              </el-button>
            </div>
          </div>
        </div>

        <!-- ==================== 录音模式 ==================== -->
        <div v-else class="rec-panel">
          <!-- 录音控制条 -->
          <div class="rec-control-bar" :class="{ 'is-recording': isRecording && !isPaused, 'is-paused': isPaused }">
            <div class="rec-control-left">
              <!-- 未开始 -->
              <template v-if="!isRecording && !isPaused">
                <el-button type="danger" size="large" round @click="startNewRecording" class="rec-start-btn">
                  <span class="rec-dot"></span>开始录音
                </el-button>
                <div class="rec-options-inline">
                  <span class="opt-label">分段间隔</span>
                  <el-select v-model="segmentDuration" size="default" style="width:100px">
                    <el-option :value="300" label="5 分钟" />
                    <el-option :value="600" label="10 分钟" />
                    <el-option :value="900" label="15 分钟" />
                    <el-option :value="1800" label="30 分钟" />
                  </el-select>
                </div>
              </template>
              <!-- 录音中 -->
              <template v-if="isRecording && !isPaused">
                <div class="rec-live-indicator">
                  <span class="rec-live-dot"></span>
                  <span class="rec-live-text">录音中</span>
                </div>
                <div class="rec-actions-group">
                  <el-button type="warning" plain round @click="pauseRecording">⏸ 暂停</el-button>
                  <el-button type="danger" plain round @click="stopRecording">⏹ 结束录音</el-button>
                </div>
              </template>
              <!-- 已暂停 -->
              <template v-if="isPaused">
                <div class="rec-paused-indicator">
                  <span>⏸</span>
                  <span>已暂停</span>
                </div>
                <div class="rec-actions-group">
                  <el-button type="success" plain round @click="resumeRecording">▶ 继续</el-button>
                  <el-button type="danger" plain round @click="stopRecording">⏹ 结束录音</el-button>
                </div>
              </template>
            </div>
            <el-tag v-if="transcribeError" type="danger" size="small" effect="dark" class="rec-error-tag">{{ transcribeError }}</el-tag>
          </div>

          <!-- 录音统计卡片 -->
          <div v-if="isRecording || isPaused" class="rec-stats-row">
            <div class="stat-card">
              <span class="stat-icon">⏱</span>
              <div class="stat-body">
                <span class="stat-label">总时长</span>
                <strong>{{ formatDuration(totalRecSeconds + segmentElapsed) }}</strong>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📐</span>
              <div class="stat-body">
                <span class="stat-label">当前段</span>
                <strong>{{ formatDuration(segmentElapsed) }}</strong>
              </div>
            </div>
            <div class="stat-card">
              <span class="stat-icon">📦</span>
              <div class="stat-body">
                <span class="stat-label">已分段</span>
                <strong>{{ segments.length }} 段</strong>
              </div>
            </div>
          </div>

          <!-- 未录音时的提示 -->
          <div v-if="!isRecording && !isPaused && !segments.length" class="rec-idle-hint">
            <span class="idle-icon">🎤</span>
            <p>点击上方按钮开始录音，系统将按间隔自动分段转写<br>转写完成后可切换发言人并修改内容，确认后保存为会议记录</p>
          </div>

          <!-- 分段进度列表 -->
          <div v-if="segments.length" class="rec-segments">
            <div
              v-for="(s, i) in segments"
              :key="i"
              class="rec-seg-item"
              :class="{
                'is-transcribing': s.transcribing,
                'is-done': s.text && !s.error && !s.transcribing,
                'is-error': s.error
              }"
            >
              <div class="seg-item-head">
                <div class="seg-item-left">
                  <span class="seg-num">{{ s.index }}</span>
                  <span class="seg-speaker-name" :class="{ 'seg-speaker-unknown': !s.speakerName }">
                    {{ s.speakerName || '未知' }}
                  </span>
                  <span class="seg-time-range">{{ s.startTime }} – {{ s.endTime }}</span>
                  <span class="seg-dur">· {{ formatDuration(s.duration) }}</span>
                </div>
                <div class="seg-item-status">
                  <el-tag v-if="s.transcribing" size="small" type="warning" effect="dark">
                    <span class="spinner"></span> 转写中…
                  </el-tag>
                  <el-tag v-else-if="s.error" size="small" type="danger" effect="dark">{{ s.error }}</el-tag>
                  <span v-else-if="!s.text" class="seg-idle-tag">等待转录</span>
                </div>
              </div>
              <div v-if="!s.transcribing && s.text" class="seg-item-body">
                <p class="seg-text">{{ s.text }}</p>
                <div class="seg-item-footer">
                  <span v-if="s.speakerConfidence != null" class="seg-confidence">置信度 {{ Math.round(s.speakerConfidence * 100) }}%</span>
                  <div class="seg-item-actions">
                    <el-button link size="small" type="primary" @click="saveSegmentDirect(s)">保存</el-button>
                    <el-button link size="small" type="primary" @click="editSegment(s)">编辑</el-button>
                    <el-popconfirm title="删除此分段？" @confirm="removeSegment(i)">
                      <template #reference>
                        <el-button link size="small" type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 会议进行中：结果区 -->
    <div v-if="meeting?.status === 'active'" class="mr-body">
      <!-- 移动端：议题在记录上方 -->
      <div class="mr-agenda-top">
        <el-card shadow="never" class="summary-card agenda-mini-card">
          <template #header>
            <span class="card-h">议题({{ agendaItems.length }})</span>
            <el-tag v-if="resolvedCount" size="small" type="success" effect="plain">{{ resolvedCount }}/{{ agendaItems.length }} 已决议</el-tag>
          </template>
          <div v-if="!agendaItems.length" class="empty small">暂无议题</div>
          <div v-for="a in agendaItems" :key="a.id" class="agenda-mini-item" :class="{ 'agenda-mini--resolved': a.status === 'resolved' }">
            <div class="agenda-mini-top">
              <span class="agenda-mini-status">{{ statusIcon(a.status) }}</span>
              <span class="agenda-mini-title" :class="{ 'agenda-mini-title--done': a.status === 'resolved' }">{{ a.title }}</span>
              <el-tag size="small" :type="priType(a.priority)" effect="plain">{{ priLabel(a.priority) }}</el-tag>
            </div>
            <div class="agenda-mini-meta">
              提交人：{{ name(a.authorId) }}
              <span v-if="a.emotionLevel != null">· 情绪 {{ a.emotionLevel }}</span>
              <span>· 共鸣 {{ (a.resonance || []).length }}</span>
            </div>
            <div v-if="a.desc" class="agenda-mini-desc">{{ a.desc }}</div>
            <div class="agenda-mini-status-bar">
              <span class="ams-btn" :class="{ active: a.status === 'pending' }" @click="onAgendaStatus(a.id, 'pending')">待讨论</span>
              <span class="ams-sep">→</span>
              <span class="ams-btn" :class="{ active: a.status === 'discussing' }" @click="onAgendaStatus(a.id, 'discussing')">讨论中</span>
              <span class="ams-sep">→</span>
              <span class="ams-btn" :class="{ active: a.status === 'resolved' }" @click="onAgendaStatus(a.id, 'resolved')">已决议</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 左侧：会议记录列表 -->
      <div class="mr-records">
        <el-card shadow="never" class="records-card">
          <template #header><span class="card-h">会议记录({{ records.length }})</span></template>

          <!-- 记录列表 -->
          <div v-if="records.length" class="record-list">
            <div v-for="r in records" :key="r.id" class="record-item" :class="{ 'has-tag': r.manualTags.length || r.source === 'ai', 'is-editing': editing === r.id }">
              <div class="r-top">
                <span class="r-se">#{{ r.seq }}</span>
                <template v-if="editing !== r.id">
                  <strong>{{ name(r.speakerId) }}</strong>
                </template>
                <span class="r-time">{{ r.timestamp }}</span>
                <el-tag v-if="r.source === 'ai'" size="small" type="warning" effect="dark">🎙️ 录音转录</el-tag>
                <el-tag v-for="t in r.manualTags" :key="t" size="small" effect="dark" style="color:#fff">{{ t }}</el-tag>
              </div>
              <!-- 编辑模式 -->
              <template v-if="editing === r.id">
                <div class="edit-inline">
                  <div class="edit-field">
                    <span class="edit-label">发言人</span>
                    <el-select v-model="editSpeaker" size="default" style="width:160px" placeholder="选择发言人">
                      <el-option v-for="m in members" :key="m.id" :label="m.name" :value="m.id" />
                    </el-select>
                  </div>
                  <el-input v-model="editContent" type="textarea" :rows="3" placeholder="修改记录内容…" class="edit-textarea" />
                  <div class="edit-footer">
                    <el-button size="small" type="primary" @click="onSaveEdit(r)" :disabled="!editContent.trim()">保存</el-button>
                    <el-button size="small" @click="onCancelEdit">取消</el-button>
                  </div>
                </div>
              </template>
              <!-- 正常模式 -->
              <div v-else class="r-content">{{ r.content }}</div>
              <div v-if="editing !== r.id" class="r-actions">
                <el-dropdown trigger="click" @command="(tag) => onManualTag(r, tag)">
                  <el-button link size="small" type="primary">标签</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="结论">结论</el-dropdown-item>
                      <el-dropdown-item command="待定">待定</el-dropdown-item>
                      <el-dropdown-item command="行动项">行动项</el-dropdown-item>
                      <el-dropdown-item command="情感记录">情感记录</el-dropdown-item>
                      <el-dropdown-item command="" divided>清除标签</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button link size="small" type="primary" @click="onAddPatch(r)">打补丁</el-button>
                <el-button link size="small" type="primary" @click="onStartEdit(r)">编辑</el-button>
                <el-popconfirm title="删除此记录？" @confirm="store.dispatch('familyMeeting/removeRecord', r.id)">
                  <template #reference>
                    <el-button link size="small" type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
              <div v-if="patching === r.id" class="patch-inline">
                <el-input v-model="patchContent" type="textarea" :rows="2" placeholder="补充说明或修正……" />
                <el-select v-model="patchType" size="small" style="width:120px">
                  <el-option v-for="pt in patchTypes" :key="pt" :label="pt" :value="pt" />
                </el-select>
                <el-button size="small" type="primary" @click="onSavePatch">保存补丁</el-button>
                <el-button size="small" @click="patching = null">取消</el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty">暂无记录，切换到「录音模式」或「文本模式」开始记录吧～</div>
        </el-card>
      </div>

      <!-- 右侧：议题 + 结构化摘要 -->
      <div class="mr-sidebar">
        <el-card shadow="never" class="summary-card agenda-mini-card">
          <template #header>
            <span class="card-h">议题({{ agendaItems.length }})</span>
            <el-tag v-if="resolvedCount" size="small" type="success" effect="plain">{{ resolvedCount }}/{{ agendaItems.length }} 已决议</el-tag>
          </template>
          <div v-if="!agendaItems.length" class="empty small">暂无议题</div>
          <div v-for="a in agendaItems" :key="a.id" class="agenda-mini-item" :class="{ 'agenda-mini--resolved': a.status === 'resolved' }">
            <div class="agenda-mini-top">
              <span class="agenda-mini-status">{{ statusIcon(a.status) }}</span>
              <span class="agenda-mini-title" :class="{ 'agenda-mini-title--done': a.status === 'resolved' }">{{ a.title }}</span>
              <el-tag size="small" :type="priType(a.priority)" effect="plain">{{ priLabel(a.priority) }}</el-tag>
            </div>
            <div class="agenda-mini-meta">
              提交人：{{ name(a.authorId) }}
              <span v-if="a.emotionLevel != null">· 情绪 {{ a.emotionLevel }}</span>
              <span>· 共鸣 {{ (a.resonance || []).length }}</span>
            </div>
            <div v-if="a.desc" class="agenda-mini-desc">{{ a.desc }}</div>
            <div class="agenda-mini-status-bar">
              <span class="ams-btn" :class="{ active: a.status === 'pending' }" @click="onAgendaStatus(a.id, 'pending')">待讨论</span>
              <span class="ams-sep">→</span>
              <span class="ams-btn" :class="{ active: a.status === 'discussing' }" @click="onAgendaStatus(a.id, 'discussing')">讨论中</span>
              <span class="ams-sep">→</span>
              <span class="ams-btn" :class="{ active: a.status === 'resolved' }" @click="onAgendaStatus(a.id, 'resolved')">已决议</span>
            </div>
          </div>
        </el-card>

        <!-- 摘要：PC端在右侧，移动端在下 -->
        <el-card shadow="never" class="summary-card summary-card-last">
          <template #header><span class="card-h">会议摘要</span></template>
          <div class="sum-group">
            <h4>✅ 结论 ({{ summary.结论.length }})</h4>
            <div v-for="(r, i) in summary.结论" :key="i" class="sum-item con">{{ r.content }}</div>
          </div>
          <div class="sum-group">
            <h4>⏳ 待定 ({{ summary.待定.length }})</h4>
            <div v-for="(r, i) in summary.待定" :key="i" class="sum-item pending">{{ r.content }}</div>
          </div>
          <div class="sum-group">
            <h4>📌 行动项 ({{ summary.行动项.length }})</h4>
            <div v-for="(r, i) in summary.行动项" :key="i" class="sum-item action">
              {{ r.content }}
              <el-button v-if="!taskRecordIds.has(r.id)" link size="small" type="primary" @click="onAddTaskFrom(r)">创建决策任务</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
    </template>
    <el-empty v-else description="请先选择或新建一个会议" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MeetingSelect from './MeetingSelect.vue'
import { extractTaskTitle, extractDueDate, transcribeViaBackend } from '../utils/transcribe.js'
import { getVoiceprints } from '@/api/familyMeeting'

const store = useStore()
const router = useRouter()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')

const mode = ref(store.state.familyMeeting.settings?.defaultMode === 'voice' ? 'record' : 'text')
const textInput = ref('')
const textSpeaker = ref(store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId)
const textSource = ref('')     // 'ai' = 来自录音转录
const textTimestamp = ref('')  // 录音时间段
const editingSegment = ref(null)  // 当前正在编辑的分段引用

// 录音相关 - 支持暂停/继续 + 自动分段 + 后端转写
const isRecording = ref(false)         // 是否正在录音（含暂停状态）
const isPaused = ref(false)            // 是否已暂停
const segmentElapsed = ref(0)          // 当前段已录秒数
const totalRecSeconds = ref(0)         // 已完成段累计秒数
const segments = ref([])               // 所有分段 [{index, startTime, endTime, duration, text, transcribing, error, engine, saved}]
const transcribing = ref(false)
const transcribeError = ref('')
const segmentDuration = ref(store.state.familyMeeting.settings?.defaultSegmentDuration || 600)       // 分段间隔（秒），默认10分钟

let mediaRecorder = null
let audioStream = null
let recInterval = null                 // 段计时器
let segmentStartTimestamp = 0          // 当前段开始时间戳

const patching = ref(null)
const patchContent = ref('')
const patchType = ref('补充')
const patchTypes = ['补充', '修正', '新进展', '情感回顾']

const editing = ref(null)       // 正在编辑的记录 id
const editContent = ref('')
const editSpeaker = ref('')

const meeting = computed(() => store.getters['familyMeeting/meetingById'](meetingId.value) || {})
const records = computed(() => store.getters['familyMeeting/recordsForMeeting'](meetingId.value))
const tasks = computed(() => store.state.familyMeeting.tasks)
const taskRecordIds = computed(() => new Set(tasks.value.filter(t => t.meetingId === meetingId.value).map(t => t.recordId)))
const members = computed(() => store.state.familyMeeting.members)
const ptNames = computed(() => (meeting.value.participants || []).map(id => store.getters['familyMeeting/memberName'](id)).join(', '))
const agendaItems = computed(() => store.getters['familyMeeting/agendaForMeeting'](meetingId.value))
const familyId = computed(() => store.state.familyMeeting.family?.id)

// 声纹列表（用于显示已录入声纹的成员）
const voiceprints = ref([])

const statusText = computed(() => ({ pre: '筹备中', active: '进行中', closed: '已结束' })[meeting.value.status] || '')
const statusTag = computed(() => ({ pre: 'warning', active: 'success', closed: 'info' })[meeting.value.status] || 'info')

const resolvedCount = computed(() => agendaItems.value.filter(a => a.status === 'resolved').length)

function name(id) { return store.getters['familyMeeting/memberName'](id) }
function statusIcon(s) {
  return { pending: '⏳', discussing: '💬', resolved: '✅' }[s] || '⏳'
}
function priType(p) { return ['info', 'info', '', 'warning', 'danger'][p - 1] }
function priLabel(p) { return ['很低', '低', '中', '高', '很高'][p - 1] }
function onAgendaStatus(id, status) {
  store.dispatch('familyMeeting/updateAgenda', { id, patch: { status } })
}

function tagColor(t) { return ({ 结论: '#10b981', 待定: '#f59e0b', 行动项: '#6366f1', 情感记录: '#94a3b8' })[t] || '#6366f1' }

// 结构化摘要（按标签分组）
const summary = computed(() => {
  const all = records.value
  return {
    结论: all.filter(r => r.manualTags.includes('结论')),
    待定: all.filter(r => r.manualTags.includes('待定')),
    行动项: all.filter(r => r.manualTags.includes('行动项'))
  }
})

function switchToText() {
  mode.value = 'text'
  textSource.value = ''
  textTimestamp.value = ''
  editingSegment.value = null
}

function onStart() { store.dispatch('familyMeeting/startMeeting', meetingId.value); ElMessage.success('会议已开始') }
function onClose() { store.dispatch('familyMeeting/closeMeeting', meetingId.value); ElMessage.success('会议已结束') }

// 文本模式保存
function onSaveText() {
  const content = textInput.value.trim()
  if (!content) return
  const payload = {
    meetingId: meetingId.value,
    speakerId: textSpeaker.value,
    content
  }
  if (textSource.value === 'ai') {
    payload.source = 'ai'
    payload.timestamp = textTimestamp.value
  }
  store.dispatch('familyMeeting/addRecord', payload)
  textInput.value = ''
  textSource.value = ''
  textTimestamp.value = ''
  // 如果来自录音分段编辑，保存后从分段列表移除
  if (editingSegment.value) {
    const idx = segments.value.indexOf(editingSegment.value)
    if (idx >= 0) segments.value.splice(idx, 1)
    editingSegment.value = null
  }
  ElMessage.success('记录已保存')
}

// ==================== 录音模式 ====================

/** 开始新的录音会话 */
async function startNewRecording() {
  try {
    transcribeError.value = ''

    // 🔍 检查所有成员是否已录入声纹
    await fetchVoiceprints()
    const enrolledIds = new Set(voiceprints.value.map(v => v.memberId))
    const unenrolledMembers = members.value.filter(m => !enrolledIds.has(m.id))
    if (unenrolledMembers.length > 0) {
      const names = unenrolledMembers.map(m => m.name).join('、')
      try {
        await ElMessageBox.confirm(
          `以下成员尚未录入声纹：${names}\n\n录音将无法自动识别他们的发言。是否先去录入声纹？`,
          '声纹缺失提醒',
          { confirmButtonText: '去录入声纹', cancelButtonText: '跳过，继续录音', type: 'warning', distinguishCancelAndClose: true }
        )
        // 用户选择去录入声纹，跳转到家庭成员管理
        router.push('/home/familyEducation/members')
        return
      } catch (action) {
        // 点击 × 或空白处关闭 → 直接取消，不开始录音
        if (action !== 'cancel') return
        // 用户点击「跳过，继续录音」，继续录音流程
      }
    }

    // 检测浏览器录音能力（线上已全站 HTTPS，无需额外安全上下文检测）
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      ElMessage.error('当前浏览器不支持录音功能，请使用 Chrome / Edge / Safari 最新版，或避免在微信内置浏览器中打开')
      return
    }

    // 提前查询麦克风权限状态（如果已拒绝，提前给指引）
    let permissionState = 'prompt'
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const perm = await navigator.permissions.query({ name: 'microphone' })
        permissionState = perm.state
        if (permissionState === 'denied') {
          ElMessageBox.alert(
            '麦克风权限已被拒绝。请在浏览器地址栏左侧的锁/信息图标中，将"麦克风"权限改为"允许"，然后重新点击开始录音。',
            '需要麦克风权限',
            { confirmButtonText: '知道了', type: 'warning', center: true }
          )
          return
        }
      }
    } catch {
      // 某些浏览器不支持 permissions.query('microphone')，忽略即可
    }

    // 获取麦克风权限（移动端必须在用户手势中调用）
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // 优先使用 webm/opus，移动端 Safari 回退到 mp4
    let mimeType = ''
    const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg']
    for (const m of mimes) {
      if (MediaRecorder.isTypeSupported(m)) {
        mimeType = m
        break
      }
    }

    mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)

    // 每次 timeslice 到期 → 一个分段完成
    mediaRecorder.ondataavailable = (e) => {
      if (!e.data || e.data.size < 1024) return // < 1KB 视为空段
      onSegmentCollected(e.data)
    }

    mediaRecorder.onstop = () => {
      cleanupRecordingState()
    }

    mediaRecorder.onerror = (e) => {
      console.error('MediaRecorder 错误:', e.error)
      transcribeError.value = '录音器异常，请刷新页面重试'
      cleanupRecordingState()
    }

    // 启动录音，按 segmentDuration 自动分段
    mediaRecorder.start(segmentDuration.value * 1000)
    isRecording.value = true
    isPaused.value = false
    segmentElapsed.value = 0
    segmentStartTimestamp = Date.now()

    // 计时器：每秒更新当前段已录时长
    recInterval = setInterval(() => {
      if (segmentStartTimestamp > 0) {
        segmentElapsed.value = Math.floor((Date.now() - segmentStartTimestamp) / 1000)
      }
    }, 1000)

    ElMessage.success(`开始录音，每 ${formatDuration(segmentDuration.value)} 自动分段`)
  } catch (err) {
    console.error('录音启动失败:', err)

    // 根据错误类型给出精准提示
    const errName = err.name || ''
    const errMsg = err.message || ''

    if (errName === 'NotAllowedError' || errMsg.includes('Permission')) {
      ElMessageBox.alert(
        '无法访问麦克风：权限被拒绝。请在浏览器设置中允许本站使用麦克风，然后重试。\n\n📱 移动端操作提示：\n• iPhone/iPad：设置 → Safari → 麦克风 → 允许\n• Android Chrome：地址栏左侧锁图标 → 权限 → 麦克风 → 允许',
        '麦克风权限被拒绝',
        { confirmButtonText: '知道了', type: 'warning', center: true }
      )
    } else if (errName === 'NotFoundError' || errMsg.includes('NotFound') || errMsg.includes('constraint')) {
      ElMessage.error('未检测到麦克风设备，请检查设备连接')
    } else if (errName === 'NotReadableError') {
      ElMessage.error('麦克风被其他应用占用，请关闭其他使用麦克风的应用后重试')
    } else if (errName === 'SecurityError') {
      ElMessage.error('非安全环境（HTTP）禁止访问麦克风，请使用 HTTPS 访问本站')
    } else {
      ElMessage.error('无法访问麦克风: ' + (errMsg || '请检查浏览器权限'))
    }
  }
}

/** 暂停录音（timeslice 计时器同步暂停） */
function pauseRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return
  mediaRecorder.pause()
  isPaused.value = true
  // 计时器继续显示当前段已录时长（冻结在当前值）
  clearInterval(recInterval)
  recInterval = setInterval(() => {
    if (segmentStartTimestamp > 0) {
      segmentElapsed.value = Math.floor((Date.now() - segmentStartTimestamp) / 1000)
    }
  }, 1000)
  ElMessage.info('录音已暂停')
}

/** 继续录音（timeslice 计时器同步恢复） */
function resumeRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'paused') return
  mediaRecorder.resume()
  isPaused.value = false
  // 计时器继续（暂停期间 segmentStartTimestamp 不变，继续后正常递增）
  clearInterval(recInterval)
  recInterval = setInterval(() => {
    if (segmentStartTimestamp > 0) {
      segmentElapsed.value = Math.floor((Date.now() - segmentStartTimestamp) / 1000)
    }
  }, 1000)
  ElMessage.success('继续录音')
}

/** 结束录音 */
function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return

  _wasPausedByVisibility = false  // 重置标志

  if (mediaRecorder.state === 'paused') {
    // 暂停状态下结束：先 resume 让 ondataavailable 能正常触发
    mediaRecorder.resume()
    isPaused.value = false
  }

  // ondataavailable 会以残余数据触发，onstop 中清理
  mediaRecorder.stop()
  ElMessage.info('正在结束录音…')
}

/** 清理录音状态（释放麦克风、定时器） */
function cleanupRecordingState() {
  clearInterval(recInterval)
  recInterval = null

  // 释放麦克风
  if (audioStream) {
    audioStream.getTracks().forEach(t => t.stop())
    audioStream = null
  }

  mediaRecorder = null
  isRecording.value = false
  isPaused.value = false
  segmentElapsed.value = 0
  segmentStartTimestamp = 0
}

/** 页面切后台时自动暂停录音（移动端常见：切换App/接电话等中断麦克风） */
let _wasPausedByVisibility = false
function handleVisibilityChange() {
  if (document.hidden && isRecording.value && !isPaused.value) {
    // 页面隐藏 → 暂停录音防止移动端异常（先设标志再暂停，避免被 pauseRecording 覆盖）
    _wasPausedByVisibility = true
    pauseRecording()
    ElMessage.warning('页面进入后台，录音已自动暂停')
  } else if (!document.hidden && _wasPausedByVisibility && isPaused.value) {
    // 页面恢复 → 自动继续
    _wasPausedByVisibility = false
    setTimeout(() => { resumeRecording() }, 500)
  }
}

// 页面关闭前确保释放麦克风
function handleBeforeUnload() {
  cleanupRecordingState()
}

async function fetchVoiceprints() {
  try {
    const fid = familyId.value
    if (!fid) return
    const res = await getVoiceprints(fid)
    if (res.success && res.data) {
      voiceprints.value = res.data
    }
  } catch { /* ignore */ }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)
  fetchVoiceprints()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  cleanupRecordingState()
})

/** 分段数据已收集 → 发起后端转写 */
async function onSegmentCollected(audioBlob) {
  const now = Date.now()
  // 该段实际录制时长
  const duration = segmentStartTimestamp > 0
    ? Math.floor((now - segmentStartTimestamp) / 1000)
    : 1

  totalRecSeconds.value += duration
  segmentElapsed.value = 0
  segmentStartTimestamp = now // 为下一段做准备

  const idx = segments.value.length + 1
  const startTime = new Date(now - duration * 1000).toLocaleTimeString('zh-CN', { hour12: false })
  const endTime = new Date(now).toLocaleTimeString('zh-CN', { hour12: false })

  // 添加占位分段
  segments.value.push({
    index: idx,
    startTime,
    endTime,
    duration,
    text: '',
    transcribing: true,
    error: '',
    engine: '',
    saved: false
  })

  // 调用后端转写（启用说话人识别）
  try {
    transcribing.value = true
    transcribeError.value = ''
    const settings = store.state.familyMeeting.settings || {}
    const hotwords = (settings.hotwords || '').split(',').map(w => w.trim()).filter(Boolean)
    const result = await transcribeViaBackend(audioBlob, {
      language: 'zh',
      hotwords,
      withDiarization: true,
      familyId: familyId.value
    })

    const seg = segments.value[segments.value.length - 1]
    seg.text = result.text
    seg.transcribing = false
    seg.engine = result.engine

    // 🎤 声纹识别结果：取置信度最高的说话人
    let speakerId = store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId || ''
    let speakerName = ''
    if (result.diarization?.segments?.length) {
      const best = result.diarization.segments.reduce((a, b) =>
        (b.confidence || 0) > (a.confidence || 0) ? b : a
      )
      speakerId = best.speakerId || speakerId
      speakerName = best.speakerName || ''
      seg.speakerId = speakerId
      seg.speakerName = speakerName
      seg.speakerConfidence = best.confidence ?? null
    }

    // 📝 转写完成，保留在分段列表中供用户编辑
    if (result.text && result.text.trim()) {
      const spLabel = speakerName ? ` · 说话人: ${speakerName}` : ''
      ElMessage.success(`第 ${idx} 段转写完成 · ${result.engine}${spLabel}`)
      // 提示声纹识别状态
      if (result.diarizationNote) {
        ElMessage.info(result.diarizationNote)
      } else if (result.diarizationError) {
        ElMessage.warning(result.diarizationError)
      } else if (!speakerName && result.diarization?.segments?.length === 0) {
        ElMessage.warning('声纹识别未匹配到说话人，请确认成员已录入声纹')
      }
    } else {
      // 静音片段：直接从列表中移除
      const segIdx = segments.value.findIndex(s => s === seg)
      if (segIdx >= 0) segments.value.splice(segIdx, 1)
    }
  } catch (err) {
    const seg = segments.value[segments.value.length - 1]
    seg.text = ''
    seg.transcribing = false
    seg.error = err.message?.slice(0, 40) || '转写失败'
    ElMessage.warning(`第 ${idx} 段转写失败: ${seg.error}`)
  } finally {
    transcribing.value = false
  }
}

/** 直接保存分段（需有说话人） */
function saveSegmentDirect(seg) {
  if (!seg.speakerId) {
    ElMessage.warning('未识别到说话人，请点击「编辑」到文本记录中选择发言人后再保存')
    return
  }
  store.dispatch('familyMeeting/addRecord', {
    meetingId: meetingId.value,
    speakerId: seg.speakerId,
    content: seg.text,
    timestamp: `${seg.startTime} - ${seg.endTime}`,
    source: 'ai'
  })
  // 保存后从分段列表移除
  const idx = segments.value.indexOf(seg)
  if (idx >= 0) segments.value.splice(idx, 1)
  ElMessage.success('已保存为会议记录')
}

/** 编辑分段：跳转到文本模式预填内容 */
function editSegment(seg) {
  editingSegment.value = seg
  mode.value = 'text'
  textSpeaker.value = seg.speakerId || store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId || ''
  textInput.value = seg.text || ''
  textSource.value = 'ai'
  textTimestamp.value = `${seg.startTime} - ${seg.endTime}`
}

/** 删除分段 */
function removeSegment(index) {
  segments.value.splice(index, 1)
  ElMessage.success('分段已删除')
}

/** 格式化秒数为 HH:MM:SS */
function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// 手动标签
function onManualTag(record, tag) {
  // 互斥：一条记录只能有一个标签类型
  const tags = tag ? [tag] : []
  store.dispatch('familyMeeting/updateRecord', { id: record.id, patch: { manualTags: tags } })
}

// 补丁
function onAddPatch(r) { patching.value = r.id; patchContent.value = ''; patchType.value = '补充' }
function onSavePatch() {
  store.dispatch('familyMeeting/addPatch', {
    targetType: 'record',
    targetId: patching.value,
    meetingId: meetingId.value,
    content: patchContent.value,
    patchType: patchType.value
  })
  ElMessage.success('补丁已添加')
  patching.value = null
}

// 编辑记录
function onStartEdit(r) {
  editing.value = r.id
  editContent.value = r.content
  editSpeaker.value = r.speakerId
}
function onSaveEdit(r) {
  const content = editContent.value.trim()
  if (!content) return
  store.dispatch('familyMeeting/updateRecord', {
    id: r.id,
    patch: {
      content,
      speakerId: editSpeaker.value
    }
  })
  ElMessage.success('记录已更新')
  editing.value = null
}
function onCancelEdit() {
  editing.value = null
}

// 从摘要创建任务
function onAddTaskFrom(record) {
  const title = extractTaskTitle(record.content) || record.content.slice(0, 30)
  const due = extractDueDate(record.content)
  store.dispatch('familyMeeting/addTask', {
    recordId: record.id,
    meetingId: meetingId.value,
    title,
    assignee: record.speakerId,
    dueDate: due
  })
  ElMessage.success('任务已创建')
}
</script>

<style lang="scss" scoped>
// ==================== 根布局 ====================
.mr-root { display: flex; flex-direction: column; gap: 16px; }

// ==================== 控制卡片 ====================
.mr-ctrl {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); }
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) { padding: 14px 20px 20px; }
}

// 顶部状态行
.ctrl-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ctrl-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.ctrl-title-area {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}
.ctrl-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ctrl-actions { flex-shrink: 0; display: flex; gap: 6px; margin-left: auto; }
.ctrl-title {
  font-size: 20px; font-weight: 800; color: #0f172a;
  letter-spacing: 0.01em; word-break: break-word; min-width: 0;
}
.status-text {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  &.status-pre { color: #f59e0b; }
  &.status-active { color: #22c55e; }
  &.status-closed { color: #94a3b8; }
}

// 模式切换 + 输入区
.ctrl-input {
  display: flex; flex-direction: column; gap: 16px;
  padding-top: 16px; border-top: 1px solid #f1f5f9;
}

// ==================== 模式切换 ====================
.mode-switch {
  display: flex; gap: 4px; padding: 4px; border-radius: 14px;
  background: #f1f5f9; width: fit-content;
}
.mode-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 20px; border-radius: 11px; cursor: pointer;
  font-size: 14px; font-weight: 600; color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  user-select: none;
  &:hover { color: #475569; background: rgba(255,255,255,0.6); }
  &.active {
    color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    .mode-icon { filter: none; }
  }
}
.mode-icon { font-size: 16px; line-height: 1; }
.mode-label { font-size: 13px; }

// ==================== 文本模式面板 ====================
.text-panel {
  background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%);
  border: 1px solid #e8ecf4; border-radius: 16px;
  padding: 20px;
}
.text-body {
  display: flex; flex-direction: column; gap: 14px;
}
.text-speaker-select {
  display: flex; align-items: center; gap: 10px;
  .input-label {
    font-size: 13px; font-weight: 600; color: #475569; white-space: nowrap;
  }
}
.text-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 12px; border-color: #e2e8f0; font-size: 14px;
    line-height: 1.7; padding: 14px; resize: none;
    background: #fff; transition: all 0.25s;
    &::placeholder { color: #cbd5e1; }
    &:hover { border-color: #c7d2fe; }
    &:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  }
}
.text-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 14px;
  .text-hint { font-size: 12px; color: #94a3b8; }
  .el-button {
    font-weight: 600; padding: 10px 28px;
    &:not(.is-disabled) {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; color: #fff;
      &:hover { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35); transform: translateY(-1px); }
    }
  }
}

// ==================== 录音模式面板 ====================
.rec-panel {
  display: flex; flex-direction: column; gap: 14px;
}

// 录音控制条
.rec-control-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 16px 20px; border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0; transition: all 0.35s;
  flex-wrap: wrap;

  &.is-recording {
    background: linear-gradient(135deg, #fef2f2 0%, #fdf2f8 100%);
    border-color: #fecaca;
  }
  &.is-paused {
    background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
    border-color: #fde68a;
  }
}
.rec-control-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.rec-actions-group { display: flex; gap: 10px; }
.rec-error-tag { flex-shrink: 0; }

// 开始录音按钮
.rec-start-btn {
  font-weight: 700 !important; padding: 12px 28px !important; font-size: 15px !important;
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: none !important; color: #fff !important;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
  transition: all 0.3s;
  display: flex; align-items: center; gap: 8px;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4); }
}
.rec-dot {
  width: 10px; height: 10px; margin-right: 8px; border-radius: 50%; background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
}
.rec-options-inline {
  display: flex; align-items: center; gap: 8px;
  .opt-label { font-size: 13px; color: #64748b; font-weight: 500; white-space: nowrap; }
}

// 录音中指示器
.rec-live-indicator {
  display: flex; align-items: center; gap: 10px; padding: 4px 0;
}
.rec-live-dot {
  width: 12px; height: 12px; border-radius: 50%; background: #ef4444;
  animation: rec-pulse 1.2s ease-in-out infinite;
  box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.15);
}
@keyframes rec-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}
.rec-live-text { font-size: 15px; font-weight: 700; color: #dc2626; letter-spacing: 0.02em; }

// 暂停指示器
.rec-paused-indicator {
  display: flex; align-items: center; gap: 8px; padding: 4px 0;
  font-size: 15px; font-weight: 700; color: #d97706;
}

// 录音统计行
.rec-stats-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.stat-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 14px;
  background: #fff; border: 1px solid #e8ecf4;
  transition: all 0.2s;
  .stat-icon { font-size: 22px; flex-shrink: 0; }
  .stat-body { display: flex; flex-direction: column; gap: 2px; }
  .stat-label { font-size: 11px; color: #94a3b8; font-weight: 500; }
  strong { font-size: 22px; color: #0f172a; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.2; }
}

// 空闲提示
.rec-idle-hint {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 32px 20px; border-radius: 14px;
  background: #fafbff; border: 1px dashed #e2e8f0;
  .idle-icon { font-size: 32px; opacity: 0.5; }
  p { margin: 0; font-size: 13px; color: #94a3b8; text-align: center; line-height: 1.6; }
}

// ==================== 分段进度列表 ====================
.rec-segments {
  display: flex; flex-direction: column; gap: 8px;
  max-height: 320px; overflow-y: auto; padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.rec-seg-item {
  padding: 14px 16px; border-radius: 14px; border: 1px solid #e8ecf4;
  background: #fff; transition: all 0.2s;
  &.is-transcribing {
    border-left: 4px solid #f59e0b; background: linear-gradient(135deg, #fffdf5, #fffbeb);
  }
  &.is-done {
    border-left: 4px solid #10b981; background: #f0fdf6;
  }
  &.is-error {
    border-left: 4px solid #ef4444; background: #fef2f2;
  }
}
.seg-item-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
}
.seg-item-left {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  .seg-num {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0;
  }
  .seg-speaker-name {
    font-size: 12px; font-weight: 600; color: #6366f1;
    max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    &.seg-speaker-unknown { color: #94a3b8; font-weight: 400; }
  }
  .seg-time-range { font-size: 12px; color: #475569; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .seg-dur { font-size: 11px; color: #94a3b8; }
}
.seg-item-status {
  flex-shrink: 0;
  .spinner {
    display: inline-block; width: 10px; height: 10px; border: 2px solid #fbbf24;
    border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 2px;
    vertical-align: middle;
  }
}
@keyframes spin { to { transform: rotate(360deg); } }

.seg-item-body {
  margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;
  .seg-text {
    font-size: 13px; color: #334155; line-height: 1.6; margin: 0;
    word-break: break-word; white-space: pre-wrap;
  }
  .seg-text-muted { color: #94a3b8; font-style: italic; }
}
.seg-item-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  margin-top: 8px; flex-wrap: wrap;
}
.seg-confidence {
  font-size: 11px; color: #94a3b8;
}
.seg-item-actions {
  display: flex; gap: 2px; flex-shrink: 0;
}
.seg-idle-tag {
  font-size: 12px; color: #94a3b8; white-space: nowrap;
}

// ==================== 结果区域 ====================
.mr-body { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; }
.mr-records { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.records-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); }
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) { padding: 18px 20px 20px; }
}
.empty { color: #94a3b8; text-align: center; padding: 48px 0; font-size: 14px; line-height: 1.6; }
.empty.small { padding: 20px 0; font-size: 13px; }

// ==================== 记录列表 ====================
.record-list { display: flex; flex-direction: column; gap: 10px; max-height: 480px; overflow-y: auto; padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.record-item {
  padding: 14px 16px; border-radius: 14px; border: 1px solid #e8ecf4; background: #fff;
  transition: all 0.2s;
  &.has-tag { border-left: 4px solid #6366f1; }
  &.is-editing { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  &:hover { border-color: #c7d2fe; box-shadow: 0 2px 12px rgba(99,102,241,0.06); }
}
.r-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.r-se { font-weight: 700; color: #6366f1; flex-shrink: 0; font-size: 13px; }
.r-time { font-size: 11px; color: #94a3b8; white-space: nowrap; font-variant-numeric: tabular-nums; }
.r-content { font-size: 14px; color: #334155; line-height: 1.7; word-break: break-word; white-space: pre-wrap; }
.r-actions {
  display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  :deep(.el-button) { margin: 0; padding: 0 4px; }
}
.patch-inline {
  display: flex; gap: 10px; align-items: center; margin-top: 10px;
  background: #faf5ff; padding: 12px; border-radius: 10px; flex-wrap: wrap;
  border: 1px solid #ede9fe;
  :deep(.el-textarea__inner) { border-radius: 8px; }
}

// 编辑内联表单
.edit-inline {
  display: flex; flex-direction: column; gap: 12px;
  margin: 8px 0; padding: 14px; border-radius: 12px;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
  border: 1px solid #e0e7ff;
}
.edit-field {
  display: flex; align-items: center; gap: 10px;
  .edit-label { font-size: 13px; font-weight: 600; color: #475569; white-space: nowrap; }
}
.edit-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 10px; border-color: #e2e8f0; font-size: 14px;
    line-height: 1.7; padding: 12px; resize: vertical; background: #fff;
    &:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
  }
}
.edit-footer {
  display: flex; justify-content: flex-end; gap: 10px;
}

// ==================== 右侧摘要 ====================
.mr-sidebar {
  display: flex; flex-direction: column; gap: 14px;
  position: sticky; top: 0;
}
.summary-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); }
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) { padding: 18px 20px 20px; }
}
.card-h { font-weight: 700; font-size: 15px; color: #0f172a; letter-spacing: 0.01em; }
.sum-group {
  margin-bottom: 16px;
  &:last-child { margin-bottom: 0; }
  h4 { font-size: 14px; margin: 0 0 8px; color: #0f172a; font-weight: 700; }
}
.sum-item {
  font-size: 13px; padding: 8px 12px; border-radius: 10px; margin-bottom: 6px;
  line-height: 1.5;
  &:last-child { margin-bottom: 0; }
  &.con { background: #ecfdf5; color: #065f46; border-left: 3px solid #10b981; }
  &.pending { background: #fffbeb; color: #92400e; border-left: 3px solid #f59e0b; }
  &.action { background: #eef2ff; color: #3730a3; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; border-left: 3px solid #6366f1; }
}

// 右侧议题列表
.agenda-mini-card { margin-bottom: 16px; }
.agenda-mini-item {
  padding: 10px 0; border-bottom: 1px dashed #f1f5f9;
  &:last-child { border-bottom: none; }
}
.agenda-mini--resolved { opacity: 0.5; }
.agenda-mini-top { display: flex; align-items: center; gap: 6px; }
.agenda-mini-status { font-size: 14px; flex-shrink: 0; }
.agenda-mini-title {
  flex: 1; min-width: 0; font-size: 13px; font-weight: 600; color: #0f172a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.agenda-mini-title--done { text-decoration: line-through; color: #94a3b8; }
.agenda-mini-meta {
  font-size: 11px; color: #94a3b8; margin-top: 3px; padding-left: 20px;
}
.agenda-mini-desc {
  font-size: 12px; color: #475569; margin-top: 4px; padding-left: 20px;
  line-height: 1.4; word-break: break-word;
}
.agenda-mini-status-bar {
  display: flex; align-items: center; gap: 0; margin-top: 6px; padding-left: 20px;
}
.ams-btn {
  padding: 2px 8px; border-radius: 10px;
  font-size: 11px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  color: #94a3b8; background: #f1f5f9;
  &:hover { background: #eef2ff; color: #6366f1; }
  &.active {
    color: #fff; font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 1px 4px rgba(99,102,241,0.3);
    &:last-child { background: linear-gradient(135deg, #10b981, #059669); }
  }
}
.ams-sep { color: #cbd5e1; font-size: 10px; padding: 0 2px; }
// 移动端议题区：PC隐藏，移动端显示在记录上方
.mr-agenda-top { display: none; }

// ==================== 响应式 ====================
@media (max-width: 1024px) {
  .mr-body { grid-template-columns: 1fr; }
  .mr-sidebar { order: 1; position: static; }
  .mr-agenda-top { display: block; }
  .mr-sidebar .agenda-mini-card { display: none; }
}

@media (max-width: 768px) {
  .mr-ctrl {
    :deep(.el-card__header) { padding: 14px 16px; }
    :deep(.el-card__body) { padding: 12px 16px 16px; }
  }
  .ctrl-top { gap: 6px; }
  .ctrl-title-row { gap: 8px; }
  .ctrl-title { font-size: 17px; }
  .ctrl-actions { margin-left: 0; }
  .ctrl-sub-row { gap: 6px; }
  .ctrl-input { gap: 12px; padding-top: 12px; }

  // 录音：开始录音和分段间隔一行
  .rec-control-left { gap: 10px; }
  .rec-start-btn { flex: 0 0 auto; }
  .rec-options-inline { flex: 1; }

  .record-list { max-height: 360px; }
  .rec-segments { max-height: 240px; }

  .mode-tab { padding: 8px 16px; .mode-label { font-size: 12px; } }
  .text-panel { padding: 14px; }
  .text-speaker-select { flex-wrap: wrap; }

  .rec-control-bar { padding: 12px 14px; flex-direction: column; align-items: flex-start; }
  .rec-control-left { width: 100%; }
  .rec-stats-row { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card { padding: 10px 12px; .stat-icon { font-size: 18px; } strong { font-size: 18px; } }
  .seg-item-head { gap: 6px; }

  .text-footer { flex-wrap: wrap; .text-hint { order: 2; width: 100%; text-align: right; } }
  .sum-item.action { flex-direction: column; align-items: flex-start; gap: 4px; }
  .sum-item.action .el-button { font-size: 12px; }
}

@media (max-width: 480px) {
  .mr-root { gap: 12px; }
  .mr-ctrl {
    :deep(.el-card__header) { padding: 12px 14px; }
    :deep(.el-card__body) { padding: 10px 14px 14px; }
  }

  .ctrl-title { font-size: 16px; }
  .ctrl-actions { margin-left: 0; width: 100%; .el-button { flex: 1; } }

  .mode-tab { padding: 7px 14px; gap: 6px; .mode-icon { font-size: 14px; } .mode-label { font-size: 11px; } }

  .rec-stats-row { grid-template-columns: 1fr; gap: 6px; }
  .stat-card { flex-direction: row; .stat-body { flex-direction: row; gap: 6px; align-items: baseline; } }

  .rec-start-btn { width: 100%; justify-content: center; }
  .rec-options-inline { flex: 1; justify-content: flex-end; }
  .rec-actions-group { width: 100%; .el-button { flex: 1; } }

  .record-item { padding: 12px 14px; border-radius: 12px; }
  .r-content { font-size: 13px; }
  .patch-inline { flex-direction: column; align-items: stretch; }

  .edit-inline { padding: 12px; }
  .edit-field { flex-wrap: wrap; }
}
</style>

<style lang="scss">
// ==================== 暗色模式 ====================
html.dark-mode {
  // 控制卡片
  .mr-ctrl {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .el-card__header { border-bottom-color: #252540; background: #212136; }
    .ctrl-title { color: #e2dee9; }
    .ctrl-input { border-top-color: #252540; }
  }

  // 模式切换
  .mode-switch { background: #252540; }
  .mode-tab {
    color: #64748b;
    &:hover { color: #94a3b8; background: rgba(255,255,255,0.04); }
    &.active {
      color: #fff;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
    }
  }

  // 文本模式
  .text-panel {
    background: linear-gradient(135deg, #212136 0%, #1e1a2e 100%);
    border-color: #2d2d4a;
  }
  .text-speaker-select .input-label { color: #94a3b8; }
  .text-textarea {
    .el-textarea__inner {
      background: #252540; border-color: #2d2d4a; color: #cbd5e1;
      &::placeholder { color: #64748b; }
      &:hover { border-color: #5b4bcf; }
      &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    }
  }
  .text-footer .text-hint { color: #64748b; }

  // 录音控制条
  .rec-control-bar {
    background: linear-gradient(135deg, #1e1e2e, #212136); border-color: #2d2d4a;
    &.is-recording {
      background: linear-gradient(135deg, #2a1a1a 0%, #251a24 100%); border-color: #3d1a1a;
    }
    &.is-paused {
      background: linear-gradient(135deg, #251e12 0%, #1e1a10 100%); border-color: #3d3310;
    }
  }
  .rec-live-text { color: #f87171; }
  .rec-paused-indicator { color: #fbbf24; }
  .rec-options-inline .opt-label { color: #94a3b8; }

  // 统计卡片
  .stat-card {
    background: #252540; border-color: #2d2d4a;
    .stat-label { color: #64748b; }
    strong { color: #e2dee9; }
  }

  // 空闲提示
  .rec-idle-hint {
    background: #1e1e2e; border-color: #2d2d4a;
    p { color: #64748b; }
  }

  // 分段列表
  .rec-segments { &::-webkit-scrollbar-thumb { background: #3a3a5a; } }
  .rec-seg-item {
    background: #252540; border-color: #2d2d4a;
    &.is-transcribing { border-left-color: #f59e0b; background: linear-gradient(135deg, #1e1a10, #1a1810); }
    &.is-done { border-left-color: #10b981; background: rgba(16, 185, 129, 0.06); }
    &.is-error { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.06); }
  }
  .seg-item-left {
    .seg-time-range { color: #94a3b8; }
    .seg-dur { color: #64748b; }
  }
  .seg-item-body {
    border-top-color: #2d2d4a;
    .seg-text { color: #cbd5e1; }
    .seg-text-muted { color: #64748b; }
  }
  .seg-speaker-name { color: #a78bfa; &.seg-speaker-unknown { color: #64748b; } }
  .seg-confidence { color: #64748b; }
  .seg-idle-tag { color: #64748b; }

  // 记录列表
  .empty { color: #64748b; }
  .record-item {
    background: #252540; border-color: #2d2d4a;
    &.has-tag { border-left-color: #a78bfa; }
    &.is-editing { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    &:hover { border-color: #5b4bcf; box-shadow: 0 2px 12px rgba(99,102,241,0.12); }
  }
  .r-se { color: #a78bfa; }
  .r-time { color: #64748b; }
  .r-content { color: #cbd5e1; }
  .r-actions { border-top-color: #252540; }
  .record-list { &::-webkit-scrollbar-thumb { background: #3a3a5a; } }
  .patch-inline { background: rgba(167, 139, 250, 0.06); border-color: #2d2d4a; }

  // 编辑内联
  .edit-inline {
    background: linear-gradient(135deg, #1e1e36 0%, #1e1a2e 100%);
    border-color: #2d2d4a;
    .edit-label { color: #94a3b8; }
  }
  .edit-textarea {
    .el-textarea__inner {
      background: #252540; border-color: #2d2d4a; color: #cbd5e1;
      &:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
    }
  }

  // 记录卡片 & 右侧摘要（统一 card 样式）
  .records-card, .summary-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .el-card__header { border-bottom-color: #252540; background: #212136; }
    .el-card__body { background: #1e1e2e; }
  }
  .card-h { color: #e2dee9; }
  .sum-group h4 { color: #e2dee9; }
  .sum-item {
    &.con { background: rgba(16, 185, 129, 0.08); color: #6ee7b7; border-left-color: #10b981; }
    &.pending { background: rgba(245, 158, 11, 0.08); color: #fcd34d; border-left-color: #f59e0b; }
    &.action { background: rgba(167, 139, 250, 0.08); color: #c4b5fd; border-left-color: #a78bfa; }
  }

  // 议题
  .agenda-mini-item { border-bottom-color: #2d2d4a; }
  .agenda-mini-title { color: #e2dee9; }
  .agenda-mini-title--done { color: #64748b; }
  .agenda-mini-meta { color: #64748b; }
  .agenda-mini-desc { color: #94a3b8; }
  .agenda-mini--resolved { opacity: 0.5; }
  .ams-btn { color: #64748b; background: #2d2d4a; }
  .ams-btn:hover { background: #2a2448; color: #a78bfa; }
  .ams-sep { color: #4b5563; }
}
</style>

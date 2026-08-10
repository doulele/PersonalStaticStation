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

          <!-- 分段进度列表（支持多人说话识别） -->
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
              <!-- 分段头部：时间信息 -->
              <div class="seg-item-head">
                <div class="seg-item-left">
                  <span class="seg-num">{{ s.index }}</span>
                  <span class="seg-time-range">{{ s.startTime }} – {{ s.endTime }}</span>
                  <span class="seg-dur">· {{ formatDuration(s.duration) }}</span>
                  <span v-if="s.turns?.length > 1" class="seg-turn-count">{{ s.turns.length }}人发言</span>
                </div>
                <div class="seg-item-status">
                  <el-tag v-if="s.transcribing" size="small" type="warning" effect="dark">
                    <span class="spinner"></span> 转写中…
                  </el-tag>
                  <el-tag v-else-if="s.error" size="small" type="danger" effect="dark">{{ s.error }}</el-tag>
                  <span v-else-if="!s.turns && !s.text" class="seg-idle-tag">等待转录</span>
                </div>
              </div>

              <!-- 多人说话：按说话人分turn展示 -->
              <div v-if="!s.transcribing && s.turns?.length" class="seg-turns">
                <div
                  v-for="(turn, ti) in s.turns"
                  :key="ti"
                  class="turn-item"
                  :class="{ 'turn-saved': turn.saved }"
                >
                  <div class="turn-head">
                    <span class="turn-speaker" :class="{ 'turn-speaker-unknown': !turn.speakerName }">
                      🗣 {{ turn.speakerName || '未知说话人' }}
                    </span>
                    <span v-if="turn.confidence != null" class="turn-confidence">
                      置信度 {{ Math.round(turn.confidence * 100) }}%
                    </span>
                  </div>
                  <p class="turn-text">{{ turn.text }}</p>
                  <div class="turn-actions">
                    <el-button
                      link size="small" type="primary"
                      @click="saveTurn(s, ti)"
                      :disabled="turn.saved"
                    >{{ turn.saved ? '已保存' : '保存' }}</el-button>
                    <el-button link size="small" type="primary" @click="editTurn(s, ti)">编辑</el-button>
                    <el-popconfirm title="删除此发言？" @confirm="removeTurn(s, ti)">
                      <template #reference>
                        <el-button link size="small" type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>

              <!-- 降级：无声纹识别时的纯文本展示 -->
              <div v-else-if="!s.transcribing && s.text && !s.turns" class="seg-item-body">
                <p class="seg-text">{{ s.text }}</p>
                <div class="seg-item-footer">
                  <div class="seg-item-actions">
                    <el-button link size="small" type="primary" @click="editSegment(s)">编辑</el-button>
                    <el-popconfirm title="删除此分段？" @confirm="removeSegment(i)">
                      <template #reference>
                        <el-button link size="small" type="danger">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </div>

              <!-- 删除整个分段 -->
              <div v-if="!s.transcribing && (s.turns?.length || s.text)" class="seg-del-row">
                <el-popconfirm title="删除整个分段？所有发言人内容将一起删除" @confirm="removeSegment(i)">
                  <template #reference>
                    <el-button link size="small" type="danger">删除分段</el-button>
                  </template>
                </el-popconfirm>
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
const editingTurnIdx = ref(-1)    // 当前正在编辑的turn索引，-1表示整段编辑

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
  editingTurnIdx.value = -1
}

function onStart() { store.dispatch('familyMeeting/startMeeting', meetingId.value); ElMessage.success('会议已开始') }
function onClose() { store.dispatch('familyMeeting/closeMeeting', meetingId.value); ElMessage.success('会议已结束') }

// 文本模式保存
function onSaveText() {
  const content = textInput.value.trim()
  if (!content) return

  // 如果来自turn编辑：更新对应turn
  if (editingSegment.value && editingTurnIdx.value >= 0) {
    const turns = editingSegment.value.turns
    if (turns && turns[editingTurnIdx.value]) {
      turns[editingTurnIdx.value].text = content
      turns[editingTurnIdx.value].speakerId = textSpeaker.value
      // 同步更新 speakerName
      if (members.value) {
        const m = members.value.find(m => m.id === textSpeaker.value)
        if (m) turns[editingTurnIdx.value].speakerName = m.name
      }
      ElMessage.success('发言已更新')
    }
    editingSegment.value = null
    editingTurnIdx.value = -1
    textInput.value = ''
    textSource.value = ''
    textTimestamp.value = ''
    return
  }

  // 普通保存（文本记录或整段编辑）
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
    editingTurnIdx.value = -1
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
        router.push('/familyEducation/members')
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

    // 🎤 声纹识别结果：将Whisper分段按说话人分组为turns
    if (result.diarization?.segments?.length) {
      const turns = result.diarization.segments
        .filter(ds => ds.text && ds.text.trim())
        .map(ds => ({
          speakerId: ds.speakerId || null,
          speakerName: ds.speakerName || '',
          text: ds.text || '',
          confidence: ds.confidence ?? null,
          saved: false
        }))
      seg.turns = turns
      // 确保seg.text也有值用于降级展示
      seg.text = turns.map(t => t.text).join('\n')

      const speakerNames = [...new Set(turns.map(t => t.speakerName || '未知'))]
      const spLabel = speakerNames.length ? ` · 说话人: ${speakerNames.join('、')}` : ''
      ElMessage.success(`第 ${idx} 段转写完成 · ${result.engine}${spLabel}`)
      if (speakerNames.length > 1) {
        ElMessage.info(`检测到 ${speakerNames.length} 人发言，请核对并保存`)
      }
      // 提示声纹识别状态
      if (result.diarizationNote) {
        ElMessage.info(result.diarizationNote)
      } else if (result.diarizationError) {
        ElMessage.warning(result.diarizationError)
      }
    } else if (result.text && result.text.trim()) {
      // 无声纹识别 → 降级为纯文本
      ElMessage.success(`第 ${idx} 段转写完成 · ${result.engine}`)
      if (result.diarizationNote) {
        ElMessage.info(result.diarizationNote)
      } else if (result.diarizationError) {
        ElMessage.warning(result.diarizationError)
      } else {
        ElMessage.warning('无声纹识别结果，请确认成员已录入声纹')
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

/** 保存单个说话人的turn到会议记录 */
function saveTurn(seg, turnIdx) {
  const turn = seg.turns?.[turnIdx]
  if (!turn) return
  if (!turn.speakerId) {
    ElMessage.warning('未识别到说话人，请先编辑选择发言人后再保存')
    return
  }
  store.dispatch('familyMeeting/addRecord', {
    meetingId: meetingId.value,
    speakerId: turn.speakerId,
    content: turn.text,
    timestamp: `${seg.startTime} – ${seg.endTime}`,
    source: 'ai'
  })
  turn.saved = true
  ElMessage.success('已保存为会议记录')
}

/** 编辑单个turn：跳转到文本模式预填内容 */
function editTurn(seg, turnIdx) {
  const turn = seg.turns?.[turnIdx]
  if (!turn) return
  editingSegment.value = seg
  editingTurnIdx.value = turnIdx
  mode.value = 'text'
  textSpeaker.value = turn.speakerId || store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId || ''
  textInput.value = turn.text || ''
  textSource.value = 'ai'
  textTimestamp.value = `${seg.startTime} – ${seg.endTime}`
}

/** 删除单个turn */
function removeTurn(seg, turnIdx) {
  seg.turns.splice(turnIdx, 1)
  if (seg.turns.length === 0) {
    const segIdx = segments.value.indexOf(seg)
    if (segIdx >= 0) segments.value.splice(segIdx, 1)
  }
  ElMessage.success('发言已删除')
}

/** 编辑整段（降级：无声纹识别时的纯文本展示用） */
function editSegment(seg) {
  editingSegment.value = seg
  editingTurnIdx.value = -1
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

<style lang="scss" scoped src="./MeetingRoom.scss"></style>

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
  .seg-turn-count { color: #a78bfa; background: rgba(167,139,250,0.12); }

  // 暗色：Turns
  .seg-turns { }
  .turn-item {
    background: #1e1e2e; border-color: #2d2d4a;
    &.turn-saved { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.2); }
    &:hover { border-color: #4c4c7a; }
  }
  .turn-speaker { color: #a78bfa; &.turn-speaker-unknown { color: #64748b; } }
  .turn-confidence { color: #64748b; }
  .turn-text { color: #cbd5e1; }
  .turn-actions { border-top-color: #2d2d4a; }

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

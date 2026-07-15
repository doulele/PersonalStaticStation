<template>
  <div class="mr-root">
    <MeetingSelect v-model="meetingId" />
    <template v-if="meetingId">

    <!-- 会议状态控制栏 -->
    <el-card shadow="never" class="mr-ctrl">
      <div class="ctrl-left">
        <el-tag :type="statusTag" size="large">{{ statusText }}</el-tag>
        <span class="ctrl-title">{{ meeting?.title }}</span>
        <el-tag size="small" effect="plain">参与者：{{ ptNames }}</el-tag>
      </div>
      <div class="ctrl-right">
        <el-button v-if="meeting?.status === 'pre'" type="success" @click="onStart">开始会议</el-button>
        <el-button v-if="meeting?.status === 'active'" type="danger" @click="onClose">结束会议</el-button>
      </div>
    </el-card>

    <!-- 会议进行中 -->
    <div v-if="meeting?.status === 'active'" class="mr-body">
      <!-- 左侧：记录区 -->
      <div class="mr-records">
        <!-- 模式切换 -->
        <el-radio-group v-model="mode" size="small" class="mode-bar">
          <el-radio-button value="text">✏️ 文本模式</el-radio-button>
          <el-radio-button value="record">🎙️ 录音模式</el-radio-button>
        </el-radio-group>

        <!-- 录音模式 -->
        <template v-if="mode === 'record'">
          <el-card shadow="never" class="rec-card">
            <!-- 录音控制栏 -->
            <div class="rec-bar">
              <!-- 未开始：开始按钮 -->
              <template v-if="!isRecording && !isPaused">
                <el-button type="danger" @click="startNewRecording">🎙️ 开始录音</el-button>
                <span class="rec-off">最长支持数小时，按间隔自动分段转写</span>
              </template>
              <!-- 录音中 -->
              <template v-if="isRecording && !isPaused">
                <el-button type="warning" @click="pauseRecording">⏸ 暂停</el-button>
                <el-button type="danger" @click="stopRecording">⏹ 结束</el-button>
                <span class="rec-on">🔴 录音中</span>
              </template>
              <!-- 已暂停 -->
              <template v-if="isPaused">
                <el-button type="success" @click="resumeRecording">▶ 继续</el-button>
                <el-button type="danger" @click="stopRecording">⏹ 结束</el-button>
                <span class="rec-paused">⏸ 已暂停</span>
              </template>
              <el-tag v-if="transcribeError" type="danger" size="small" effect="plain" style="margin-left:8px">
                {{ transcribeError }}
              </el-tag>
              <div class="rec-options" v-if="!isRecording || isPaused">
                <span class="opt-label">分段间隔</span>
                <el-select
                  v-model="segmentDuration"
                  size="small"
                  style="width:100px"
                  :disabled="isRecording && !isPaused"
                >
                  <el-option :value="300" label="5 分钟" />
                  <el-option :value="600" label="10 分钟" />
                  <el-option :value="900" label="15 分钟" />
                  <el-option :value="1800" label="30 分钟" />
                </el-select>
              </div>
            </div>

            <!-- 录音统计 -->
            <div v-if="isRecording || isPaused" class="rec-stats">
              <div class="stat-item">
                <span class="stat-label">总时长</span>
                <strong>{{ formatDuration(totalRecSeconds + segmentElapsed) }}</strong>
              </div>
              <div class="stat-item">
                <span class="stat-label">当前段</span>
                <strong>{{ formatDuration(segmentElapsed) }}</strong>
              </div>
              <div class="stat-item">
                <span class="stat-label">已分段</span>
                <strong>{{ segments.length }} 段</strong>
              </div>
            </div>

            <el-alert
              type="info" :closable="false" show-icon
              title="提示"
              description="语音转写调用后端 faster-whisper / whisper.cpp 引擎。请先在终端执行 pip install faster-whisper 安装转写服务。"
              style="margin-top:10px"
            />

            <!-- 分段列表 -->
            <div v-if="segments.length" class="seg-list">
              <div v-for="(s, i) in segments" :key="i" class="seg-item" :class="{ 'seg-done': !s.transcribing && s.text, 'seg-saved': s.saved }">
                <div class="seg-head">
                  <span class="seg-idx">分段 {{ s.index }}</span>
                  <span class="seg-time">{{ s.startTime }} → {{ s.endTime }}</span>
                  <span class="seg-dur">({{ formatDuration(s.duration) }})</span>
                  <el-tag v-if="s.transcribing" size="small" type="warning">转写中…</el-tag>
                  <el-tag v-else-if="s.error" size="small" type="danger">{{ s.error }}</el-tag>
                  <el-tag v-else-if="s.saved" size="small" type="success">已保存</el-tag>
                  <el-tag v-else-if="s.text" size="small" :type="s.engine ? 'success' : 'info'" effect="plain">
                    {{ s.engine ? `已转写 · ${s.engine}` : '无内容' }}
                  </el-tag>
                </div>
                <div v-if="!s.transcribing" class="seg-edit">
                  <el-input
                    v-model="s.text"
                    type="textarea"
                    :rows="2"
                    :placeholder="s.text ? '可编辑转写结果后保存' : '转写为空，可手动输入内容'"
                    size="small"
                    style="flex:1"
                    @keyup.ctrl.enter="onSaveChunk(i)"
                  />
                  <el-button
                    size="small"
                    type="primary"
                    @click="onSaveChunk(i)"
                    :disabled="!s.text.trim()"
                  >保存为记录</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </template>

        <!-- 文本模式 -->
        <el-card v-else shadow="never" class="text-card">
          <div class="text-input-row">
            <el-input
              v-model="textInput"
              type="textarea"
              :rows="2"
              placeholder="输入记录内容……"
              @keyup.enter.ctrl="onSaveText"
            />
            <div class="text-actions">
              <el-select v-model="textSpeaker" size="small" style="width:120px">
                <el-option v-for="m in members" :key="m.id" :label="m.name" :value="m.id" />
              </el-select>
              <el-button type="primary" size="small" @click="onSaveText" :disabled="!textInput">保存</el-button>
            </div>
          </div>
          <el-divider />
        </el-card>

        <!-- 记录列表 -->
        <div v-if="records.length" class="record-list">
          <div
            v-for="r in records"
            :key="r.id"
            class="record-item"
            :class="{ 'has-tag': r.autoTags.length || r.manualTags.length }"
          >
            <div class="r-top">
              <span class="r-se">#{{ r.seq }}</span>
              <span class="r-time">{{ r.timestamp }}</span>
              <strong>{{ name(r.speakerId) }}</strong>
              <!-- 自动标签 -->
              <el-tag
                v-for="t in r.autoTags"
                :key="t"
                size="small"
                :color="tagColor(t)"
                effect="dark"
                style="color:#fff"
              >AI:{{ t }}</el-tag>
              <!-- 手动标签 -->
              <el-tag
                v-for="t in r.manualTags"
                :key="t"
                size="small"
                effect="dark"
                style="color:#fff"
              >{{ t }}</el-tag>
              <el-dropdown trigger="click" @command="(tag) => onManualTag(r, tag)">
                <el-button link size="small" type="primary">+标签</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="结论">结论</el-dropdown-item>
                    <el-dropdown-item command="待定">待定</el-dropdown-item>
                    <el-dropdown-item command="行动项">行动项</el-dropdown-item>
                    <el-dropdown-item command="情感记录">情感记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="r-content">{{ r.content }}</div>
            <div class="r-actions">
              <el-button link size="small" type="primary" @click="onAddPatch(r)">打补丁</el-button>
              <el-popconfirm title="删除此记录？" @confirm="store.dispatch('familyMeeting/removeRecord', r.id)">
                <template #reference>
                  <el-button link size="small" type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
            <!-- 内联补丁 -->
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
        <div v-else class="empty">暂无记录，开始记录你的家庭会议吧～</div>
      </div>

      <!-- 右侧：结构化摘要 -->
      <div class="mr-sidebar">
        <el-card shadow="never" class="summary-card">
          <template #header><span class="card-h">📊 会议摘要</span></template>
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
              <el-button link size="small" type="primary" @click="onAddTaskFrom(r)">→ 创建任务</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import MeetingSelect from './MeetingSelect.vue'
import { autoTag, extractTaskTitle, extractDueDate, transcribeViaBackend } from '../utils/transcribe.js'

const store = useStore()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')

const mode = ref('text')
const textInput = ref('')
const textSpeaker = ref(store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId)

// 录音相关 - 支持暂停/继续 + 自动分段 + 后端转写
const isRecording = ref(false)         // 是否正在录音（含暂停状态）
const isPaused = ref(false)            // 是否已暂停
const segmentElapsed = ref(0)          // 当前段已录秒数
const totalRecSeconds = ref(0)         // 已完成段累计秒数
const segments = ref([])               // 所有分段 [{index, startTime, endTime, duration, text, transcribing, error, engine, saved}]
const transcribing = ref(false)
const transcribeError = ref('')
const segmentDuration = ref(600)       // 分段间隔（秒），默认10分钟

let mediaRecorder = null
let audioStream = null
let recInterval = null                 // 段计时器
let segmentStartTimestamp = 0          // 当前段开始时间戳

const patching = ref(null)
const patchContent = ref('')
const patchType = ref('补充')
const patchTypes = ['补充', '修正', '新进展', '情感回顾']

const meeting = computed(() => store.getters['familyMeeting/meetingById'](meetingId.value) || {})
const records = computed(() => store.getters['familyMeeting/recordsForMeeting'](meetingId.value))
const members = computed(() => store.state.familyMeeting.members)
const ptNames = computed(() => (meeting.value.participants || []).map(id => store.getters['familyMeeting/memberName'](id)).join(', '))

const statusText = computed(() => ({ pre: '筹备中', active: '进行中', closed: '已结束' })[meeting.value.status] || '')
const statusTag = computed(() => ({ pre: 'warning', active: 'success', closed: 'info' })[meeting.value.status] || 'info')

function name(id) { return store.getters['familyMeeting/memberName'](id) }

function tagColor(t) { return ({ 结论: '#10b981', 待定: '#f59e0b', 行动项: '#6366f1', 情感记录: '#94a3b8' })[t] || '#6366f1' }

// 结构化摘要（按标签分组）
const summary = computed(() => {
  const all = records.value
  return {
    结论: all.filter(r => r.autoTags.includes('结论') || r.manualTags.includes('结论')),
    待定: all.filter(r => r.autoTags.includes('待定') || r.manualTags.includes('待定')),
    行动项: all.filter(r => r.autoTags.includes('行动项') || r.manualTags.includes('行动项'))
  }
})

function onStart() { store.dispatch('familyMeeting/startMeeting', meetingId.value); ElMessage.success('会议已开始') }
function onClose() { store.dispatch('familyMeeting/closeMeeting', meetingId.value); ElMessage.success('会议已结束') }

// 文本模式保存
function onSaveText() {
  const content = textInput.value.trim()
  if (!content) return
  const tags = autoTag(content, [])
  // 如果包含行动项关键词，尝试抽时间
  let taskInfo = null
  if (tags.includes('行动项')) {
    const title = extractTaskTitle(content)
    const due = extractDueDate(content)
    if (title) taskInfo = { title, due }
  }
  store.dispatch('familyMeeting/addRecord', {
    meetingId: meetingId.value,
    speakerId: textSpeaker.value,
    content,
    autoTags: tags
  })
  textInput.value = ''
  // auto create task
  if (taskInfo) {
    store.dispatch('familyMeeting/addTask', {
      meetingId: meetingId.value,
      title: taskInfo.title,
      dueDate: taskInfo.due
    })
    ElMessage.success('已添加记录，并自动创建行动项')
  } else {
    ElMessage.success('记录已保存')
  }
}

// ==================== 录音模式 ====================

/** 开始新的录音会话 */
async function startNewRecording() {
  try {
    transcribeError.value = ''

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

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)
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

  // 调用后端转写
  try {
    transcribing.value = true
    transcribeError.value = ''
    const settings = store.state.familyMeeting.settings || {}
    const hotwords = (settings.hotwords || '').split(',').map(w => w.trim()).filter(Boolean)
    const result = await transcribeViaBackend(audioBlob, { language: 'zh', hotwords })

    const seg = segments.value[segments.value.length - 1]
    seg.text = result.text
    seg.transcribing = false
    seg.engine = result.engine

    if (result.text) {
      ElMessage.success(`第 ${idx} 段转写完成 · ${result.engine}`)
    } else {
      ElMessage.warning(`第 ${idx} 段转写为空，可能为静音片段`)
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

function onSaveChunk(idx) {
  const seg = segments.value[idx]
  if (!seg || !seg.text.trim()) return
  const tags = autoTag(seg.text, [])
  const speakerId = store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId
  store.dispatch('familyMeeting/addRecord', {
    meetingId: meetingId.value,
    speakerId,
    timestamp: `${seg.startTime} - ${seg.endTime}`,
    duration: seg.duration,
    content: seg.text.trim(),
    autoTags: tags
  })
  seg.saved = true
  ElMessage.success('已保存为会议记录')
}

// 手动标签
function onManualTag(record, tag) {
  const tags = [...record.manualTags]
  if (tags.includes(tag)) return
  tags.push(tag)
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
.mr-root { display: flex; flex-direction: column; gap: 16px; }
.mr-ctrl {
  display: flex; align-items: center; justify-content: space-between;
  border-radius: 16px; flex-wrap: wrap; gap: 12px;
  padding: 16px 20px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  background: linear-gradient(135deg, #fff 0%, #fafbff 100%);
  .ctrl-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ctrl-title { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em; }
  .ctrl-right { flex-shrink: 0; }
}
.mr-body { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; }
.mr-records { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.mode-bar {
  margin-bottom: 2px;
  :deep(.el-radio-button__inner) {
    border-radius: 10px;
    font-weight: 600;
  }
}

// ===== 录音卡片 =====
.rec-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.rec-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  .el-button + .el-button { margin-left: 0; }
  .el-button {
    border-radius: 10px;
    font-weight: 600;
    transition: all 0.2s;
  }
}
.rec-on {
  font-weight: 700; color: #ef4444; font-size: 14px; white-space: nowrap;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.rec-off { color: #94a3b8; font-size: 13px; }
.rec-paused { font-weight: 700; color: #f59e0b; font-size: 14px; white-space: nowrap; }
.rec-options {
  display: flex; align-items: center; gap: 8px; margin-left: auto;
  .opt-label { font-size: 12px; color: #64748b; white-space: nowrap; }
  :deep(.el-select .el-input__wrapper) { border-radius: 8px; }
}
.rec-stats {
  display: flex; gap: 20px; margin-top: 14px; padding: 14px 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 14px;
  border: 1px solid #e8ecf4;
  .stat-item {
    display: flex; flex-direction: column; align-items: center; flex: 1;
    .stat-label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    strong { font-size: 20px; color: #0f172a; font-variant-numeric: tabular-nums; font-weight: 700; }
  }
}
.seg-list {
  margin-top: 14px; display: flex; flex-direction: column; gap: 12px;
  max-height: 440px; overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.seg-item {
  border: 1px solid #e8ecf4; border-radius: 12px; padding: 14px;
  background: #fff; transition: all 0.25s;
  &.seg-done { border-left: 4px solid #10b981; background: #f0fdf6; }
  &.seg-saved { border-left: 4px solid #6366f1; background: #fafbff; }
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
}
.seg-head {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;
  .seg-idx { font-weight: 700; color: #6366f1; font-size: 13px; flex-shrink: 0; }
  .seg-time { font-size: 11px; color: #64748b; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .seg-dur { font-size: 11px; color: #94a3b8; font-variant-numeric: tabular-nums; }
}
.seg-edit {
  display: flex; gap: 10px; align-items: flex-start;
  .el-textarea { flex: 1; min-width: 0; }
  .el-button { flex-shrink: 0; border-radius: 8px; }
  :deep(.el-textarea__inner) { border-radius: 10px; }
}

// ===== 文本模式 =====
.text-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  :deep(.el-textarea__inner) { border-radius: 10px; border-color: #e8ecf4; }
}
.text-input-row { .text-actions { display: flex; gap: 10px; margin-top: 10px; align-items: center; flex-wrap: wrap; } }
.empty { color: #94a3b8; text-align: center; padding: 48px 0; font-size: 14px; }

// ===== 记录列表 =====
.record-list { display: flex; flex-direction: column; gap: 10px; }
.record-item {
  padding: 16px; border-radius: 14px; border: 1px solid #e8ecf4; background: #fff;
  transition: all 0.2s;
  &.has-tag { border-left: 4px solid #6366f1; }
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); border-color: #c7d2fe; }
}
.r-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.r-se { font-weight: 700; color: #6366f1; flex-shrink: 0; font-size: 13px; }
.r-time { font-size: 11px; color: #94a3b8; white-space: nowrap; font-variant-numeric: tabular-nums; }
.r-content { font-size: 14px; color: #334155; line-height: 1.7; word-break: break-word; white-space: pre-wrap; }
.r-actions { display: flex; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.patch-inline {
  display: flex; gap: 10px; align-items: center; margin-top: 10px;
  background: #faf5ff; padding: 12px; border-radius: 10px; flex-wrap: wrap;
  border: 1px solid #ede9fe;
  :deep(.el-textarea__inner) { border-radius: 8px; }
}

// ===== 右侧摘要 =====
.mr-sidebar {
  display: flex; flex-direction: column; gap: 14px;
  position: sticky; top: 0;
}
.summary-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  :deep(.el-card__header) {
    padding: 16px 18px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) { padding: 16px 18px; }
}
.card-h { font-weight: 700; font-size: 15px; }
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

// ===== 响应式 =====
@media (max-width: 1024px) {
  .mr-body { grid-template-columns: 1fr; }
  .mr-sidebar { order: -1; position: static; }
}

@media (max-width: 768px) {
  .mr-ctrl {
    padding: 14px 16px;
    .ctrl-title { font-size: 15px; }
  }
  .rec-bar {
    gap: 8px;
    .el-button { font-size: 13px; padding: 8px 14px; }
  }
  .rec-off { display: none; }
  .rec-options { margin-left: 0; width: 100%; justify-content: flex-end; }
  .rec-stats { gap: 12px; padding: 12px 14px;
    .stat-item strong { font-size: 18px; }
  }
  .seg-edit {
    flex-direction: column;
    .el-button { width: 100%; }
  }
  .seg-head { gap: 6px; }
  .text-actions { flex-direction: column; align-items: stretch !important;
    .el-select { width: 100% !important; }
  }
  .summary-card { border-radius: 14px; }
}

@media (max-width: 480px) {
  .mr-root { gap: 12px; }
  .mr-ctrl { padding: 12px 14px; border-radius: 14px; }
  .record-item { padding: 12px 14px; border-radius: 12px; }
  .r-content { font-size: 13px; }
  .patch-inline { flex-direction: column; align-items: stretch; }
  .rec-stats { flex-wrap: wrap; gap: 8px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mr-ctrl {
    background: linear-gradient(135deg, #1e1e2e 0%, #212136 100%);
    border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    .ctrl-title { color: #e2dee9; }
  }
  .rec-card { background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .rec-off { color: #64748b; }
  .rec-options .opt-label { color: #94a3b8; }
  .rec-stats {
    background: linear-gradient(135deg, #1e1e2e, #252540);
    border-color: #2d2d4a;
    .stat-item {
      .stat-label { color: #64748b; }
      strong { color: #e2dee9; }
    }
  }
  .seg-list { &::-webkit-scrollbar-thumb { background: #3a3a5a; } }
  .seg-item {
    background: #252540; border-color: #2d2d4a;
    &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
    &.seg-done { border-left-color: #10b981; background: rgba(16, 185, 129, 0.06); }
    &.seg-saved { border-left-color: #a78bfa; background: rgba(167, 139, 250, 0.05); }
  }
  .seg-head {
    .seg-idx { color: #a78bfa; }
    .seg-time { color: #94a3b8; }
    .seg-dur { color: #64748b; }
  }
  .text-card { background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .empty { color: #64748b; }
  .record-item {
    background: #252540; border-color: #2d2d4a;
    &.has-tag { border-left-color: #a78bfa; }
    &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.15); border-color: #5b4bcf; }
  }
  .r-se { color: #a78bfa; }
  .r-time { color: #64748b; }
  .r-content { color: #cbd5e1; }
  .r-actions { border-top-color: #252540; }
  .patch-inline { background: rgba(167, 139, 250, 0.06); border-color: #2d2d4a; }
  .summary-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    .el-card__header { border-bottom-color: #252540; background: #212136; }
  }
  .sum-group h4 { color: #e2dee9; }
  .sum-item {
    &.con { background: rgba(16, 185, 129, 0.08); color: #6ee7b7; border-left-color: #10b981; }
    &.pending { background: rgba(245, 158, 11, 0.08); color: #fcd34d; border-left-color: #f59e0b; }
    &.action { background: rgba(167, 139, 250, 0.08); color: #c4b5fd; border-left-color: #a78bfa; }
  }
}
</style>

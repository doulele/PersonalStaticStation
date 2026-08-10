<template>
  <div class="mm-root">
    <!-- ==================== 成员列表 ==================== -->
    <div v-if="members.length > 0" class="member-list">
      <div
        v-for="m in sortedMembers"
        :key="m.id"
        class="member-item"
        :class="{ 'is-me': m.id === authUserId, 'is-editing': editingId === m.id }"
      >
        <!-- 编辑模式 -->
        <template v-if="editingId === m.id">
          <div class="mi-edit">
            <div class="mi-avatar">
              <el-avatar :size="40" :style="{ background: avatarColor(m) }">
                {{ m.name.charAt(0) }}
              </el-avatar>
            </div>
            <div class="mi-edit-fields">
              <el-input
                v-model="editName"
                size="small"
                maxlength="10"
                placeholder="姓名"
                @keyup.enter="saveEdit(m)"
              />
              <el-select v-model="editRole" size="small">
                <el-option label="管理员" value="admin" />
                <el-option label="普通成员" value="member" />
              </el-select>
            </div>
            <div class="mi-edit-actions">
              <el-button size="small" type="primary" @click="saveEdit(m)">保存</el-button>
              <el-button size="small" @click="cancelEdit">取消</el-button>
            </div>
          </div>
        </template>

        <!-- 展示模式 -->
        <template v-else>
          <div class="mi-avatar">
            <el-avatar :size="40" :style="{ background: avatarColor(m) }">
              {{ m.name.charAt(0) }}
            </el-avatar>
          </div>
          <div class="mi-body">
            <div class="mi-top">
              <div class="mi-top-left">
                <span class="mi-name">{{ m.name }}</span>
                <span v-if="m.id === authUserId" class="mi-me-tag">我</span>
                <span class="mi-role-tag" :class="m.role">
                  {{ m.role === 'admin' ? '管理员' : '成员' }}
                </span>
                <span v-if="voiceprintMap[m.id]" class="mi-vp-tag">声纹已录入</span>
              </div>
            </div>
            <div class="mi-stats">
              <span class="mi-stat">
                <el-icon :size="13"><Calendar /></el-icon>
                {{ getMemberMeetingCount(m.id) }} 次会议
              </span>
              <span class="mi-stat">
                <el-icon :size="13"><List /></el-icon>
                {{ getMemberTaskCount(m.id) }} 项任务
              </span>
              <span class="mi-stat">
                <el-icon :size="13"><ChatLineSquare /></el-icon>
                {{ getMemberRecordCount(m.id) }} 条发言
              </span>
            </div>
          </div>
          <!-- 当前登录人专属操作：录入声纹 + 退出/解散（卡片底部整行） -->
          <div v-if="m.id === authUserId" class="mi-self-actions-bottom">
            <el-button
              size="small"
              class="voiceprint-btn"
              @click="openVoiceprint(m)"
              title="录入声纹"
            >录入声纹</el-button>
            <el-button
              v-if="isAdmin"
              size="small"
              class="leave-btn"
              @click="$emit('dissolve')"
            >解散家庭</el-button>
            <el-button
              v-else
              size="small"
              class="leave-btn"
              @click="$emit('leave')"
            >退出家庭</el-button>
          </div>
          <!-- 管理员对其他成员的操作（卡片底部整行） -->
          <div v-if="canManageMembers && m.id !== authUserId" class="mi-other-actions-bottom">
            <el-button
              size="small"
              class="action-text-btn"
              @click="startEdit(m)"
            >编辑</el-button>
            <el-button
              v-if="m.id !== family?.adminId"
              size="small"
              class="action-text-btn action-text-btn-danger"
              @click="confirmKick(m)"
            >移除</el-button>
          </div>
        </template>
      </div>
    </div>

    <!-- 空成员 -->
    <div v-else class="empty-members">
      <p>暂无家庭成员</p>
    </div>

    <!-- ==================== 踢出确认 ==================== -->
    <el-dialog
      v-model="showKickConfirm"
      title="踢出成员"
      width="400px"
    >
      <div class="kick-confirm-body">
        <p>确定要将 <strong>「{{ kickingMember?.name }}」</strong> 踢出家庭空间吗？</p>
        <p class="kick-warning">该成员将被从当前家庭的所有会议中移除。</p>
      </div>
      <template #footer>
        <el-button @click="showKickConfirm = false">取消</el-button>
        <el-button type="danger" :loading="kickingId" @click="executeKick">
          确认踢出
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 声纹录入弹窗 ==================== -->
    <el-dialog
      v-model="vpDialogVisible"
      :title="'录入声纹 - ' + (vpMember?.name || '')"
      width="480px"
      :close-on-click-modal="false"
      @close="cleanupVP"
    >
      <div class="vp-dialog-body">
        <div class="vp-member-info">
          <el-avatar :size="48" :style="{ background: vpMember ? avatarColor(vpMember) : '#ccc' }">
            {{ vpMember?.name?.charAt(0) || '?' }}
          </el-avatar>
          <div class="vp-info-text">
            <strong>{{ vpMember?.name }}</strong>
            <p>请朗读下方文本以录入声纹，建议录制 10-30 秒清晰语音</p>
          </div>
        </div>

        <div class="vp-script">
          "大家好，我是{{ vpMember?.name || '...' }}，我在参加家庭会议。今天我想和大家分享一些关于我们家庭的想法和建议。"
        </div>

        <div class="vp-rec-area">
          <!-- 未开始 -->
          <template v-if="!vpRecording && !vpAudioBlob">
            <el-button type="danger" size="large" @click="startVPRecord" :disabled="vpSaving" class="vp-rec-btn">
              <el-icon :size="20"><Microphone /></el-icon> 开始录音
            </el-button>
            <span class="vp-hint">请在安静环境中朗读上方文本</span>
          </template>

          <!-- 录音中 -->
          <template v-if="vpRecording">
            <div class="vp-rec-indicator">
              <span class="vp-rec-dot"></span>
              录音中 {{ formatDuration(vpElapsed) }}
            </div>
            <el-button type="warning" size="large" @click="stopVPRecord" class="vp-rec-btn">⏹ 停止录音</el-button>
          </template>

          <!-- 录音完成 -->
          <template v-if="vpAudioBlob && !vpRecording">
            <div class="vp-preview">
              <span class="vp-done-label">✅ 录音完成 ({{ formatDuration(vpDuration) }})</span>
              <audio :src="vpAudioUrl" controls class="vp-audio-player"></audio>
            </div>
            <div class="vp-actions">
              <el-button @click="reVPRecord" :disabled="vpSaving">🔄 重新录制</el-button>
              <el-button type="primary" @click="saveVoiceprint" :loading="vpSaving">
                💾 保存声纹
              </el-button>
            </div>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen, Delete, Calendar, List, ChatLineSquare, Microphone
} from '@element-plus/icons-vue'
import { getVoiceprints, enrollVoiceprint } from '@/api/familyMeeting'

const emit = defineEmits(['memberKicked', 'dissolve', 'leave'])

const store = useStore()

// ===== 状态 =====
const editingId = ref(null)
const editName = ref('')
const editRole = ref('')
const kickingId = ref(null)
const kickingMember = ref(null)
const showKickConfirm = ref(false)

// ===== 声纹 =====
const voiceprints = ref([])
const vpDialogVisible = ref(false)
const vpMember = ref(null)
const vpRecording = ref(false)
const vpAudioBlob = ref(null)
const vpAudioUrl = ref('')
const vpDuration = ref(0)
const vpElapsed = ref(0)
const vpSaving = ref(false)
let vpMediaRecorder = null
let vpStream = null
let vpTimer = null
let vpStartTime = 0

// ===== 计算属性 =====
const members = computed(() => store.state.familyMeeting.members)
const family = computed(() => store.state.familyMeeting.family)
const authUserId = computed(() => store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId)
const isAdmin = computed(() => {
  const m = members.value.find(x => x.id === authUserId.value)
  return m?.role === 'admin'
})
const canManageMembers = computed(() => {
  return isAdmin.value || family.value?.adminId === authUserId.value
})
const meetings = computed(() => store.state.familyMeeting.meetings)
const tasks = computed(() => store.state.familyMeeting.tasks)
const records = computed(() => store.state.familyMeeting.records)

const sortedMembers = computed(() => {
  const list = [...members.value]
  return list.sort((a, b) => {
    if (a.id === authUserId.value) return -1
    if (b.id === authUserId.value) return 1
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (b.role === 'admin' && a.role !== 'admin') return 1
    return 0
  })
})

const voiceprintMap = computed(() => {
  const map = {}
  voiceprints.value.forEach(v => { map[v.memberId] = v })
  return map
})

// ===== 工具方法 =====
function avatarColor(m) {
  if (m.id === authUserId.value) return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  return m.role === 'admin'
    ? 'linear-gradient(135deg, #f59e0b, #f97316)'
    : 'linear-gradient(135deg, #06b6d4, #0ea5e9)'
}

function getMemberMeetingCount(memberId) {
  return meetings.value?.filter(m => m.participants?.includes(memberId)).length || 0
}

function getMemberTaskCount(memberId) {
  return tasks.value?.filter(t => t.assignee === memberId).length || 0
}

function getMemberRecordCount(memberId) {
  return records.value?.filter(r => r.speakerId === memberId).length || 0
}

// ===== 成员操作 =====
function startEdit(m) {
  editingId.value = m.id
  editName.value = m.name
  editRole.value = m.role
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editRole.value = ''
}

function saveEdit(m) {
  const name = editName.value.trim()
  if (!name) { ElMessage.warning('姓名不能为空'); return }
  if (members.value.some(x => x.id !== m.id && x.name === name)) {
    ElMessage.warning('已存在同名成员')
    return
  }
  store.dispatch('familyMeeting/updateMember', { id: m.id, patch: { name, role: editRole.value } })
  ElMessage.success('成员信息已更新')
  cancelEdit()
}

function confirmKick(m) {
  kickingMember.value = m
  showKickConfirm.value = true
}

async function executeKick() {
  const memberId = kickingMember.value?.id
  if (!memberId) return
  kickingId.value = memberId
  try {
    const res = await store.dispatch('familyMeeting/kickMember', memberId)
    if (res.success) {
      ElMessage.success(res.message || '已踢出成员')
      showKickConfirm.value = false
      emit('memberKicked')
    } else {
      ElMessage.error(res.error || '踢出失败')
    }
  } catch {
    ElMessage.error('踢出失败')
  } finally {
    kickingId.value = null
    kickingMember.value = null
  }
}

// ===== 声纹操作 =====
function formatDuration(s) {
  s = Math.max(0, Math.floor(s))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

async function fetchVoiceprints() {
  try {
    const fid = store.state.familyMeeting.family?.id
    if (!fid) return
    const res = await getVoiceprints(fid)
    if (res.success && res.data) {
      voiceprints.value = res.data
    }
  } catch { /* ignore */ }
}

async function openVoiceprint(m) {
  // 如果已有声纹，弹出确认提示
  if (voiceprintMap.value[m.id]) {
    try {
      await ElMessageBox.confirm('您的声音已录入，确定重新录入吗？', '确认操作', {
        confirmButtonText: '重新录入',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return // 用户取消
    }
  }
  vpMember.value = m
  vpDialogVisible.value = true
  cleanupVP()
}

function cleanupVP() {
  clearInterval(vpTimer)
  vpTimer = null
  vpStartTime = 0
  vpElapsed.value = 0
  vpRecording.value = false
  vpSaving.value = false
  if (vpMediaRecorder && vpMediaRecorder.state !== 'inactive') {
    vpMediaRecorder.stop()
  }
  vpMediaRecorder = null
  if (vpStream) {
    vpStream.getTracks().forEach(t => t.stop())
    vpStream = null
  }
  if (vpAudioUrl.value) {
    URL.revokeObjectURL(vpAudioUrl.value)
    vpAudioUrl.value = ''
  }
  vpAudioBlob.value = null
  vpDuration.value = 0
}

async function startVPRecord() {
  try {
    vpStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks = []
    let mimeType = ''
    const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
    for (const m of mimes) {
      if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
    }
    vpMediaRecorder = new MediaRecorder(vpStream, mimeType ? { mimeType } : undefined)
    vpMediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    vpMediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
      vpAudioBlob.value = blob
      vpAudioUrl.value = URL.createObjectURL(blob)
      vpDuration.value = Math.round((Date.now() - vpStartTime) / 1000)
      if (vpStream) {
        vpStream.getTracks().forEach(t => t.stop())
        vpStream = null
      }
    }
    vpMediaRecorder.start()
    vpRecording.value = true
    vpStartTime = Date.now()
    vpElapsed.value = 0
    vpTimer = setInterval(() => {
      vpElapsed.value = Math.floor((Date.now() - vpStartTime) / 1000)
    }, 1000)
  } catch (err) {
    ElMessage.error('无法访问麦克风: ' + (err.message || '请检查浏览器权限'))
    cleanupVP()
  }
}

function stopVPRecord() {
  if (vpMediaRecorder && vpMediaRecorder.state !== 'inactive') {
    vpMediaRecorder.stop()
    clearInterval(vpTimer)
  }
  vpRecording.value = false
}

function reVPRecord() {
  cleanupVP()
}

async function saveVoiceprint() {
  if (!vpAudioBlob.value || !vpMember.value) return
  vpSaving.value = true
  try {
    const fid = store.state.familyMeeting.family?.id
    const fd = new FormData()
    fd.append('audio', vpAudioBlob.value, 'voiceprint.webm')
    fd.append('familyId', fid || '')
    fd.append('memberName', vpMember.value.name)
    const res = await enrollVoiceprint(vpMember.value.id, fd)
    if (res.success) {
      ElMessage.success(`${vpMember.value.name} 的声纹已录入`)
      await fetchVoiceprints()
      vpDialogVisible.value = false
      cleanupVP()
    } else {
      ElMessage.error(res.error || '录入失败')
    }
  } catch (e) {
    ElMessage.error('录入失败: ' + e.message)
  } finally {
    vpSaving.value = false
  }
}

onMounted(() => { fetchVoiceprints() })
onUnmounted(() => { cleanupVP() })

defineExpose({ openVoiceprint })
</script>

<style lang="scss" scoped src="./MemberManagement.scss"></style>

<style lang="scss">
html.dark-mode {
  .mm-root {
    .member-item {
      background: #1e1e2e;
      border-color: #2d2d4a;

      &:hover {
        background: #252540;
        border-color: #5b4bcf;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
      }

      &.is-me {
        background: linear-gradient(135deg, #1e1a2e, #1a1a2e);
        border-color: #5b4bcf;
        &:hover { background: #252540; }
      }
      &.is-editing { background: #2a2418; border-color: #b45309; }
    }

    .mi-name { color: #e2dee9; }
    .mi-role-tag {
      &.admin { color: #fbbf24; background: #2a2418; }
      &.member { color: #22d3ee; background: #162832; }
    }
    .mi-stat { color: #64748b; .el-icon { color: #7c6fcf; } }

    .empty-members p { color: #64748b; }

    .kick-confirm-body p { color: #cbd5e1; strong { color: #e2dee9; } }
    .kick-warning { color: #64748b !important; }

    // 声纹
    .mi-vp-tag { color: #c4b5fd; background: #1e1a2e; }
    .vp-script { background: #1e1a2e; border-color: #2d2d4a; color: #a78bfa; }
    .vp-member-info .vp-info-text {
      strong { color: #e2dee9; }
      p { color: #64748b; }
    }
    .vp-rec-indicator { color: #f87171; }
    .vp-done-label { color: #34d399; }
    .vp-hint { color: #64748b; }
  }
}
</style>

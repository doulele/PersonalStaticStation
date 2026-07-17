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
                <span v-if="voiceprintMap[m.id]" class="mi-vp-tag">
                  🎤 已录
                  <el-button
                    v-if="canManageMembers || m.id === authUserId"
                    link
                    class="mi-vp-del"
                    @click.stop="deleteVP(m)"
                    title="删除声纹"
                  >×</el-button>
                </span>
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
import { ElMessage } from 'element-plus'
import {
  EditPen, Delete, Calendar, List, ChatLineSquare, Microphone
} from '@element-plus/icons-vue'
import { getVoiceprints, enrollVoiceprint, deleteVoiceprint } from '@/api/familyMeeting'

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

function openVoiceprint(m) {
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

async function deleteVP(m) {
  const fid = store.state.familyMeeting.family?.id
  if (!fid) return
  try {
    const res = await deleteVoiceprint(m.id, fid)
    if (res.success) {
      ElMessage.success(`${m.name} 的声纹已删除`)
      await fetchVoiceprints()
    } else {
      ElMessage.error(res.error || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  }
}

onMounted(() => { fetchVoiceprints() })
onUnmounted(() => { cleanupVP() })

defineExpose({ openVoiceprint })
</script>

<style lang="scss" scoped>
// ==================== 根容器 ====================
.mm-root {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ==================== 成员列表 ====================
.member-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.member-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 12px 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: #c7d2fe;
    background: #fff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.06);
    transform: translateY(-1px);

    &::before { opacity: 1; }
  }

  &.is-me {
    background: linear-gradient(135deg, #f5f3ff, #eef2ff);
    border-color: #c4b5fd;

    &::before {
      background: linear-gradient(180deg, #6366f1, #a855f7);
      opacity: 0.6;
    }

    &:hover {
      background: #fff;
      &::before { opacity: 1; }
    }
  }

  &.is-editing {
    background: #fffbeb;
    border-color: #fcd34d;
    &::before { opacity: 0; }
    &:hover { background: #fffbeb; transform: none; box-shadow: none; }
  }
}

// 成员头像
.mi-avatar {
  flex-shrink: 0;
  :deep(.el-avatar) {
    font-weight: 700;
    font-size: 17px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

// 成员信息区
.mi-body {
  flex: 1;
  min-width: 0;
}
.mi-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mi-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mi-self-actions-bottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
  flex-basis: 100%;
  margin-top: -12px;
  padding-top: 0;
  align-self: flex-start;
}
.mi-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mi-me-tag {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #6366f1;
  padding: 1px 6px;
  border-radius: 6px;
  line-height: 1.4;
  flex-shrink: 0;
}
.mi-role-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 6px;

  &.admin { color: #b45309; background: #fef3c7; }
  &.member { color: #0e7490; background: #cffafe; }
}
.mi-stats {
  display: flex;
  gap: 16px;
  margin-top: 5px;
  flex-wrap: wrap;
}
.mi-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
  .el-icon { color: #a5b4fc; }
}

// 录入声纹按钮
.voiceprint-btn {
  border: none !important;
  background: none !important;
  color: #059669 !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
  min-height: auto !important;
  &:hover {
    color: #047857 !important;
  }
}

// 退出/解散家庭按钮
.leave-btn {
  border: none !important;
  background: none !important;
  color: #ef4444 !important;
  font-size: 12px !important;
  padding: 2px 6px !important;
  min-height: auto !important;
  &:hover {
    color: #dc2626 !important;
  }
}

// 管理员对其他成员的操作按钮区（卡片底部整行）
.mi-other-actions-bottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0;
  flex-shrink: 0;
  flex-basis: 100%;
  margin-top: -12px;
  padding-top: 0;
  align-self: flex-start;
}

// 通用文字按钮
.action-text-btn {
  border: none !important;
  background: none !important;
  color: #6366f1 !important;
  font-size: 12px !important;
  padding: 2px 4px !important;
  min-height: auto !important;
  &:hover {
    color: #4338ca !important;
  }
}
.action-text-btn-danger {
  color: #ef4444 !important;
  &:hover {
    color: #dc2626 !important;
  }
}

// ==================== 编辑模式 ====================
.mi-edit {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.mi-edit-fields {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0;
  .el-input { width: 140px; }
  .el-select { width: 110px; }
}
.mi-edit-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

// ==================== 空成员 ====================
.empty-members {
  text-align: center;
  padding: 40px 20px;
  p { font-size: 14px; color: #94a3b8; margin: 0; }
}

// ==================== 踢出确认 ====================
.kick-confirm-body {
  text-align: center;
  padding: 8px 0;
  p {
    margin: 12px 0 0;
    font-size: 15px;
    color: #334155;
    strong { color: #0f172a; }
  }
}
.kick-warning {
  font-size: 13px !important;
  color: #94a3b8 !important;
  margin-top: 8px !important;
}

// ==================== 声纹标签 ====================
.mi-vp-tag {
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 1px 7px;
  border-radius: 6px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.mi-vp-del {
  font-size: 14px !important;
  font-weight: 700;
  color: #ef4444 !important;
  padding: 0 !important;
  min-height: auto !important;
  height: auto !important;
  line-height: 1;
}

// ==================== 声纹录入弹窗 ====================
.vp-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.vp-member-info {
  display: flex;
  align-items: center;
  gap: 14px;
  .vp-info-text {
    strong { font-size: 16px; color: #0f172a; }
    p { font-size: 13px; color: #64748b; margin: 4px 0 0; }
  }
}
.vp-script {
  background: #f5f3ff;
  border: 1px solid #e9d5ff;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 15px;
  color: #6d28d9;
  line-height: 1.8;
  text-align: center;
  font-style: italic;
}
.vp-rec-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.vp-rec-btn {
  min-width: 160px;
  border-radius: 12px;
  font-weight: 600;
}
.vp-hint {
  font-size: 12px;
  color: #94a3b8;
}
.vp-rec-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
  font-variant-numeric: tabular-nums;
}
.vp-rec-dot {
  width: 12px;
  height: 12px;
  background: #ef4444;
  border-radius: 50%;
  animation: vp-pulse 1s ease-in-out infinite;
}
@keyframes vp-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.vp-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.vp-done-label {
  font-size: 14px;
  font-weight: 600;
  color: #059669;
}
.vp-audio-player {
  width: 100%;
  height: 36px;
  border-radius: 8px;
}
.vp-actions {
  display: flex;
  gap: 12px;
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .member-item { padding: 12px 14px; gap: 12px; }
  .mi-stats { gap: 10px; }
  .mi-edit { flex-wrap: wrap; }
  .mi-edit-fields {
    flex: 1 1 100%;
    .el-input { flex: 1; width: auto; }
  }
  .mi-edit-actions { width: 100%; justify-content: flex-end; }
}

@media (max-width: 480px) {
  .mi-name { font-size: 14px; }
  .mi-stats { gap: 8px; }
}
</style>

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

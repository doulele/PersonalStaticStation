/**
 * 家庭会议 API
 * 使用统一的 request.js 封装，自动附加认证 token
 */
import { get, post, put, del } from './request'

const BASE = '/family-meeting'

// ==================== 全量状态 ====================

/** 获取完整状态
 * @param {string} [familyId] - 可选，指定加载哪个家庭的状态
 */
export function fetchState(familyId) {
  const params = familyId ? `?familyId=${encodeURIComponent(familyId)}` : ''
  return get(`${BASE}/state${params}`)
}

/** 保存完整状态 */
export function saveState(state) {
  return post(`${BASE}/state`, state)
}

/** 重置所有数据 */
export function resetState() {
  return del(`${BASE}/state`)
}

// ==================== 家庭空间 ====================

/** 创建家庭空间 */
export function createFamily(name, adminName) {
  return post(`${BASE}/family`, { name, adminName })
}

/** 🚪 退出家庭空间 */
export function leaveFamily() {
  return post(`${BASE}/family/leave`)
}

/** 💣 解散家庭空间（仅管理员）
 * @param {string} familyId - 要解散的家庭ID
 */
export function dissolveFamily(familyId) {
  return del(`${BASE}/family?familyId=${encodeURIComponent(familyId)}`)
}

/** 🚪 退出指定家庭空间（多家庭场景） */
export function leaveSpecificFamily(familyId) {
  return del(`${BASE}/family/${familyId}/leave`)
}

/** 📋 获取用户参与的所有家庭列表 */
export function fetchMyFamilies() {
  return get(`${BASE}/families`)
}

// ==================== 成员管理 ====================

/** 添加成员 */
export function addMember(name, role) {
  return post(`${BASE}/members`, { name, role })
}

/** 删除成员 */
export function removeMember(id) {
  return del(`${BASE}/members/${id}`)
}

/** 🚫 踢出成员（仅管理员，同时清除 membership） */
export function kickMember(id) {
  return del(`${BASE}/members/${id}/kick`)
}

/** 更新成员 */
export function updateMember(id, patch) {
  return put(`${BASE}/members/${id}`, patch)
}

// ==================== 当前用户 ====================

/** 切换当前用户 */
export function switchCurrentUser(userId) {
  return put(`${BASE}/current-user`, { userId })
}

// ==================== 会议 ====================

/** 获取会议列表 */
export function fetchMeetings() {
  return get(`${BASE}/meetings`)
}

/** 创建会议 */
export function createMeeting(data) {
  return post(`${BASE}/meetings`, data)
}

/** 更新会议 */
export function updateMeeting(id, patch) {
  return put(`${BASE}/meetings/${id}`, patch)
}

/** 删除会议 */
export function deleteMeeting(id) {
  return del(`${BASE}/meetings/${id}`)
}

// ==================== 议题 ====================

/** 获取议题列表 */
export function fetchAgendaItems(meetingId) {
  return get(`${BASE}/agenda-items`, meetingId ? { meetingId } : {})
}

/** 添加议题 */
export function addAgendaItem(data) {
  return post(`${BASE}/agenda-items`, data)
}

/** 更新议题 */
export function updateAgendaItem(id, patch) {
  return put(`${BASE}/agenda-items/${id}`, patch)
}

/** 删除议题 */
export function deleteAgendaItem(id) {
  return del(`${BASE}/agenda-items/${id}`)
}

/** 切换共鸣 */
export function toggleResonance(id, userId) {
  return post(`${BASE}/agenda-items/${id}/resonance`, { userId })
}

// ==================== 会议记录 ====================

/** 获取记录列表 */
export function fetchRecords(meetingId) {
  return get(`${BASE}/records`, meetingId ? { meetingId } : {})
}

/** 添加记录 */
export function addRecord(data) {
  return post(`${BASE}/records`, data)
}

/** 更新记录 */
export function updateRecord(id, patch) {
  return put(`${BASE}/records/${id}`, patch)
}

/** 删除记录 */
export function deleteRecord(id) {
  return del(`${BASE}/records/${id}`)
}

// ==================== 补丁 ====================

/** 获取补丁列表 */
export function fetchPatches({ targetType, targetId, meetingId } = {}) {
  const params = {}
  if (targetType) params.targetType = targetType
  if (targetId) params.targetId = targetId
  if (meetingId) params.meetingId = meetingId
  return get(`${BASE}/patches`, params)
}

/** 添加补丁 */
export function addPatch(data) {
  return post(`${BASE}/patches`, data)
}

/** 删除补丁 */
export function deletePatch(id) {
  return del(`${BASE}/patches/${id}`)
}

// ==================== 任务 ====================

/** 获取任务列表 */
export function fetchTasks(meetingId) {
  return get(`${BASE}/tasks`, meetingId ? { meetingId } : {})
}

/** 添加任务 */
export function addTask(data) {
  return post(`${BASE}/tasks`, data)
}

/** 更新任务 */
export function updateTask(id, patch) {
  return put(`${BASE}/tasks/${id}`, patch)
}

/** 删除任务 */
export function deleteTask(id) {
  return del(`${BASE}/tasks/${id}`)
}

// ==================== 情绪日志 ====================

/** 获取情绪日志 */
export function fetchEmotions({ meetingId, userId } = {}) {
  const params = {}
  if (meetingId) params.meetingId = meetingId
  if (userId) params.userId = userId
  return get(`${BASE}/emotions`, params)
}

/** 添加情绪日志 */
export function addEmotion(data) {
  return post(`${BASE}/emotions`, data)
}

// ==================== 设置 ====================

/** 获取设置 */
export function fetchSettings() {
  return get(`${BASE}/settings`)
}

/** 更新设置 */
export function updateSettings(patch) {
  return put(`${BASE}/settings`, patch)
}

// ==================== 备份 ====================

/** 导出备份 */
export function exportBackup() {
  return get(`${BASE}/export`)
}

/** 导入备份 */
export function importBackup(data) {
  return post(`${BASE}/import`, data)
}

// ==================== 🔗 邀请机制 ====================

/** 生成/刷新家庭邀请码 */
export function generateInviteCode() {
  return post(`${BASE}/invite/generate`)
}

/** 通过邀请码加入家庭
 * @param {string} inviteCode - 邀请码
 * @param {string} userName - 用户称呼
 * @param {boolean} [deleteExisting=false] - 是否删除当前已有空间后加入
 */
export function joinFamily(inviteCode, userName, deleteExisting = false) {
  return post(`${BASE}/invite/join`, { inviteCode, userName, deleteExisting })
}

// ==================== 语音转写 ====================

/** 检测可用转写引擎 */
export function getTranscribeEngines() {
  return get(`${BASE}/transcribe/engines`)
}

// ==================== 🎤 声纹识别 ====================

/** 获取家庭所有成员的声纹状态 */
export function getVoiceprints(familyId) {
  return get(`${BASE}/voiceprints?familyId=${familyId}`)
}

/** 查询某成员的声纹状态 */
export function getVoiceprintStatus(memberId, familyId) {
  return get(`${BASE}/members/${memberId}/voiceprint/status?familyId=${familyId}`)
}

/** 注册声纹（上传音频） */
export function enrollVoiceprint(memberId, formData) {
  // formData: { audio: Blob, familyId: string, memberName: string }
  const baseUrl = import.meta.env.VITE_API_BASE || '/staticTool/api'
  const headers = {}
  try {
    const token = localStorage.getItem('auth_token')
    if (token) headers['Authorization'] = `Bearer ${token}`
  } catch { /* ignore */ }
  return fetch(`${baseUrl}${BASE}/members/${memberId}/voiceprint/enroll`, {
    method: 'POST', headers, body: formData
  }).then(res => res.json())
}

/** 删除成员声纹 */
export function deleteVoiceprint(memberId, familyId) {
  return del(`${BASE}/members/${memberId}/voiceprint?familyId=${familyId}`)
}

/** 上传音频并转写（使用 FormData） */
export function transcribeAudio(formData) {
  // formData 应包含: audio(Blob), language(string), hotwords(string), withDiarization(string), familyId(string)
  // 不使用 request.js 包装，因为需要 multipart/form-data
  const baseUrl = import.meta.env.VITE_API_BASE || '/staticTool/api'

  // 🔒 携带认证 token
  const headers = {}
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } catch { /* ignore */ }

  return fetch(`${baseUrl}${BASE}/transcribe`, {
    method: 'POST',
    headers,
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}

/**
 * 家庭会议 API
 * 使用统一的 request.js 封装，自动附加认证 token
 */
import { get, post, put, del } from './request'

const BASE = '/family-meeting'

// ==================== 全量状态 ====================

/** 获取完整状态 */
export function fetchState() {
  return get(`${BASE}/state`)
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

// ==================== 成员管理 ====================

/** 添加成员 */
export function addMember(name, role) {
  return post(`${BASE}/members`, { name, role })
}

/** 删除成员 */
export function removeMember(id) {
  return del(`${BASE}/members/${id}`)
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

// ==================== 语音转写 ====================

/** 检测可用转写引擎 */
export function getTranscribeEngines() {
  return get(`${BASE}/transcribe/engines`)
}

/** 上传音频并转写（使用 FormData） */
export function transcribeAudio(formData) {
  // formData 应包含: audio(Blob), language(string), hotwords(string)
  // 不使用 request.js 包装，因为需要 multipart/form-data
  const baseUrl = import.meta.env.VITE_API_BASE || '/staticTool/api'
  return fetch(`${baseUrl}${BASE}/transcribe`, {
    method: 'POST',
    body: formData
  }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
}

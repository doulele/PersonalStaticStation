/**
 * 第二人生·任务炼金术士 API
 */
import { get, post, put, del } from './request'

const BASE = '/task-alchemist'

// ==================== 全量同步 ====================

/** 一次性拉取所有数据 */
export function syncAllFromServer() {
  return get(`${BASE}/sync-all`)
}

/** 一次性保存所有数据 */
export function syncAllToServer(data) {
  return post(`${BASE}/sync-all`, data)
}

// ==================== 用户设置 ====================

export function getSettings() {
  return get(`${BASE}/settings`)
}

export function updateSettings(data) {
  return put(`${BASE}/settings`, data)
}

// ==================== 任务 ====================

export function getTasks() {
  return get(`${BASE}/tasks`)
}

export function createTask(data) {
  return post(`${BASE}/tasks`, data)
}

export function updateTask(id, data) {
  return put(`${BASE}/tasks/${id}`, data)
}

export function deleteTask(id) {
  return del(`${BASE}/tasks/${id}`)
}

export function syncTasks(tasks) {
  return post(`${BASE}/tasks/sync`, { tasks })
}

// ==================== 心流专注 ====================

export function getFocusSessions() {
  return get(`${BASE}/focus-sessions`)
}

export function recordFocusSession(data) {
  return post(`${BASE}/focus-sessions`, data)
}

// ==================== 成就系统 ====================

export function getAchievements() {
  return get(`${BASE}/achievements`)
}

export function updateAchievements(achievements) {
  return put(`${BASE}/achievements`, { achievements })
}

// ==================== 碎片与卡牌 ====================

export function getFragments() {
  return get(`${BASE}/fragments`)
}

export function updateFragments(fragments) {
  return put(`${BASE}/fragments`, { fragments })
}

export function getCards() {
  return get(`${BASE}/cards`)
}

export function updateCards(cards) {
  return put(`${BASE}/cards`, { cards })
}

// ==================== 日报 ====================

export function getReports() {
  return get(`${BASE}/reports`)
}

export function saveReports(reports) {
  return post(`${BASE}/reports`, { reports })
}

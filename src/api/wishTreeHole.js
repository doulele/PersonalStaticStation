/**
 * 家庭愿望清单 & 树洞 API
 */
import { get, post, put, del } from './request'

const BASE = '/wish-tree-hole'

// ==================== 家庭信息（共享空间，只读） ====================

/** 获取家庭信息 — 从共享家庭空间读取 */
export function getFamily() {
  return get(`${BASE}/family`)
}

// ==================== 愿望清单 ====================

/** 获取愿望列表 */
export function getWishes(params = {}) {
  return get(`${BASE}/wishes`, params)
}

/** 获取愿望详情 */
export function getWishDetail(id) {
  return get(`${BASE}/wishes/${id}`)
}

/** 创建愿望 */
export function createWish(data) {
  return post(`${BASE}/wishes`, data)
}

/** 更新愿望 */
export function updateWish(id, data) {
  return put(`${BASE}/wishes/${id}`, data)
}

/** 删除愿望 */
export function deleteWish(id) {
  return del(`${BASE}/wishes/${id}`)
}

/** 归档愿望 */
export function archiveWish(id) {
  return post(`${BASE}/wishes/${id}/archive`)
}

/** 打卡愿望 */
export function checkinWish(id, data) {
  return post(`${BASE}/wishes/${id}/checkin`, data)
}

/** 更新子任务 */
export function updateSubTasks(id, subTasks) {
  return put(`${BASE}/wishes/${id}/subtasks`, { subTasks })
}

/** 延期愿望 */
export function delayWish(id, newDate) {
  return post(`${BASE}/wishes/${id}/delay`, { newDate })
}

// ==================== 树洞 / 情绪 ====================

/** 获取树洞流 */
export function getMoods(params = {}) {
  return get(`${BASE}/moods`, params)
}

/** 发布树洞 */
export function postMood(data) {
  return post(`${BASE}/moods`, data)
}

/** 删除树洞 */
export function deleteMood(id) {
  return del(`${BASE}/moods/${id}`)
}

/** 树洞转愿望 */
export function convertMoodToWish(id) {
  return post(`${BASE}/moods/${id}/convert`)
}

// ==================== 互动 ====================

/** 拍一拍 */
export function patUser(data) {
  return post(`${BASE}/pat`, data)
}

// ==================== 通知 ====================

/** 获取通知列表 */
export function getNotifications() {
  return get(`${BASE}/notifications`)
}

/** 标记已读 */
export function markNotificationRead(id) {
  return put(`${BASE}/notifications/${id}/read`)
}

/** 全部已读 */
export function markAllNotificationsRead() {
  return put(`${BASE}/notifications/read-all`)
}

/** 未读通知数 */
export function getUnreadCount() {
  return get(`${BASE}/notifications/unread-count`)
}

// ==================== 数据统计 ====================

/** 个人数据看板 */
export function getPersonalStats() {
  return get(`${BASE}/stats/personal`)
}

/** 家庭活跃排行 */
export function getFamilyRanking() {
  return get(`${BASE}/stats/family-ranking`)
}

/** AI破局建议 */
export function getAiBreakthrough() {
  return get(`${BASE}/ai/breakthrough`)
}

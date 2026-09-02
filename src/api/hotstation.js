/**
 * 信息工作台 — API
 */
import request from './request'

const BASE = '/hotstation'

/* ===== 信息流 ===== */
export function getEvents(params = {}) {
  return request.get(`${BASE}/events`, params)
}
export function getEventDetail(id) {
  return request.get(`${BASE}/events/${id}`)
}
export function toggleTrack(id, tracking) {
  return request.post(`${BASE}/events/${id}/track`, { tracking })
}

/* ===== 输入 ===== */
export function parseLink(url) {
  return request.post(`${BASE}/parse-link`, { url })
}
export function associateEvent(payload) {
  return request.post(`${BASE}/associate`, payload)
}
/** 多媒体投喂（图片/语音，multipart，Content-Type 由浏览器自动带 boundary） */
export function uploadMultimedia(formData) {
  return request.post(`${BASE}/multimedia`, formData)
}

/* ===== 生成 ===== */
export function generate(payload) {
  return request.post(`${BASE}/generate`, payload)
}
export function getGenerations(eventId = '') {
  return request.get(`${BASE}/generations`, { eventId })
}
export function extractTitleFormula(titles) {
  return request.post(`${BASE}/style/extract-titles`, { titles })
}
export function extractSampleStyle(sample) {
  return request.post(`${BASE}/style/extract-sample`, { sample })
}

/* ===== 策展卡 ===== */
export function getCards() {
  return request.get(`${BASE}/cards`)
}
export function createCard(payload) {
  return request.post(`${BASE}/cards`, payload)
}
export function updateCard(id, payload) {
  return request.put(`${BASE}/cards/${id}`, payload)
}
export function deleteCard(id) {
  return request.del(`${BASE}/cards/${id}`)
}

/* ===== 白皮书 ===== */
export function getWhitepapers() {
  return request.get(`${BASE}/whitepapers`)
}
export function publishWhitepaper(id, action = 'publish') {
  return request.post(`${BASE}/whitepapers/${id}/publish`, { action })
}

/* ===== 历史事件库（十年对比） ===== */
export function getHistoryEvents() {
  return request.get(`${BASE}/history-events`)
}
export function createHistoryEvent(payload) {
  return request.post(`${BASE}/history-events`, payload)
}
export function updateHistoryEvent(id, payload) {
  return request.put(`${BASE}/history-events/${id}`, payload)
}
export function deleteHistoryEvent(id) {
  return request.del(`${BASE}/history-events/${id}`)
}
export function getTodayHistory() {
  return request.get(`${BASE}/today-history`)
}
export function generateHistoryCompare(payload) {
  return request.post(`${BASE}/history-compare`, payload)
}

/* ===== 信源池 ===== */
export function getSources() {
  return request.get(`${BASE}/sources`)
}
export function toggleSource(id, enabled) {
  return request.post(`${BASE}/sources/${id}/toggle`, { enabled })
}
export function refreshSources() {
  return request.post(`${BASE}/sources/refresh`)
}

/* ===== 提醒 ===== */
export function getReminders() {
  return request.get(`${BASE}/reminders`)
}
export function dismissReminder(eventId) {
  return request.post(`${BASE}/reminders/${eventId}/dismiss`)
}

export function getMeta() {
  return request.get(`${BASE}/meta`)
}

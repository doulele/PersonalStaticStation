/**
 * 国家队动向监测 — API
 */
import request from './request'

const BASE = '/national-team'

/** 获取今日信号 */
export function getTodaySignal(date, agency = 'overview') {
  return request.get(`${BASE}/signal`, { params: { date, agency } })
}

/** 获取ETF每日数据 */
export function getETFData(params = {}) {
  return request.get(`${BASE}/etf-data`, { params })
}

/** 获取历史信号 */
export function getSignalHistory(days = 90, agency) {
  return request.get(`${BASE}/history`, { params: { days, agency } })
}

/** 获取异动列表 */
export function getAnomalies(days = 7) {
  return request.get(`${BASE}/anomalies`, { params: { days } })
}

/** 获取数据源状态 */
export function getStatus() {
  return request.get(`${BASE}/status`)
}

/** 获取触发日志 */
export function getTriggerLogs(limit = 5) {
  return request.get(`${BASE}/trigger-log`, { params: { limit } })
}

/** 手动触发采集 */
export function triggerCollection(date) {
  return request.post(`${BASE}/trigger`, { date })
}

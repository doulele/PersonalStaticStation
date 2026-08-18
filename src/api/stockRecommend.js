/**
 * 股票推荐与测评系统 — API
 */
import request from './request'

const BASE = '/stock-recommend'

/** 获取股票列表（筛选/排序/分页） */
export function getStockList(params = {}, signal) {
  return request.get(`${BASE}/list`, params, signal ? { signal } : {})
}

/** 获取股票详情（六维评分+K线+风险+资金情绪） */
export function getStockDetail(code, horizon = 'short', signal) {
  return request.get(`${BASE}/detail/${code}`, { horizon }, signal ? { signal } : {})
}

/** 搜索联想（代码/名称） */
export function searchStocks(keyword) {
  return request.get(`${BASE}/search`, { keyword })
}

/** 行业列表（筛选用） */
export function getIndustries() {
  return request.get(`${BASE}/industries`)
}

/** 行业评分排名 */
export function getIndustryRanking(horizon = 'short', params = {}) {
  return request.get(`${BASE}/industry-ranking`, { horizon, ...params })
}

/** 周期权重配置 */
export function getHorizonConfig() {
  return request.get(`${BASE}/config/horizons`)
}

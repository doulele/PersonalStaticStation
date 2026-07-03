/**
 * 油价 API 封装
 * 后端端点: /oil-price/*
 */

const BASE = '/staticTool/api/oil-price'

async function request(path) {
  const url = `${BASE}${path}`
  console.log('[油价API] 请求:', url)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[油价API] ${url} → ${res.status} ${res.statusText}`, errText)
      throw new Error(`HTTP ${res.status}: ${errText}`)
    }
    const json = await res.json()
    if (!json.success) {
      console.error(`[油价API] ${url} → 业务错误:`, json.error)
      throw new Error(json.error || '未知错误')
    }
    console.log(`[油价API] ${url} → OK`)
    return json.data
  } catch (err) {
    console.error(`[油价API] ${url} → 失败:`, err.message)
    throw err
  }
}

export function fetchProvinces() {
  return request('/provinces')
}

export function fetchCurrentPrices(province) {
  return request(`/current?province=${encodeURIComponent(province)}`)
}

export function fetchHistory(province) {
  return request(`/history?province=${encodeURIComponent(province)}`)
}

export function fetchNationalAvg() {
  return request('/national-avg')
}

export function fetchForecast() {
  return request('/forecast')
}

export function fetchIPLocate() {
  return request('/ip-locate')
}

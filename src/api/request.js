/**
 * 统一 API 请求封装
 * 自动附加认证 token，统一错误处理
 */

const API_PREFIX = '/staticTool/api'

// ==================== 全局请求管理 ====================
// 用于路由切换时自动中止上一个页面未完成的请求，避免请求堆积导致跳转慢/无法跳转
// 结构：Map<routeKey, Set<AbortController>>，每个 controller 通过 _routeKey 属性记录所属路由
const pendingRequests = new Map()
// 当前激活路由的 key（由 router 更新）
let currentRouteKey = null

/**
 * 设置当前激活路由（由 router.beforeEach 调用）
 */
export function setCurrentRoute(routeKey) {
  currentRouteKey = routeKey
}

/**
 * 注册一个请求到当前路由
 */
function registerRequest(controller) {
  const key = currentRouteKey
  if (!key) return
  controller._routeKey = key
  if (!pendingRequests.has(key)) pendingRequests.set(key, new Set())
  pendingRequests.get(key).add(controller)
}

/**
 * 从注册表移除（请求完成后调用）
 */
function unregisterRequest(controller) {
  const key = controller._routeKey
  if (!key) return
  const set = pendingRequests.get(key)
  if (set) {
    set.delete(controller)
    if (set.size === 0) pendingRequests.delete(key)
  }
}

/**
 * 中止指定路由的所有未完成请求（路由离开时调用）
 * @param {string} routeKey - 离开的路由 key
 */
export function abortRouteRequests(routeKey) {
  const set = pendingRequests.get(routeKey)
  if (!set) return
  for (const controller of set) {
    try { controller.abort() } catch { /* ignore */ }
  }
  pendingRequests.delete(routeKey)
}

/**
 * 获取存储的 auth token
 */
function getAuthToken() {
  try {
    return localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

// ==================== 全局 fetch 拦截 ====================
// 拦截 window.fetch，凡请求站内 API（/staticTool/api）且未显式传 signal 的，
// 自动创建 AbortController 并绑定到当前路由，路由离开时统一中止。
// 这样页面里直接使用原生 fetch 的请求也能获得「路由离开自动清理」能力。
let fetchInterceptorInstalled = false

export function installFetchInterceptor() {
  if (fetchInterceptorInstalled || typeof window === 'undefined') return
  fetchInterceptorInstalled = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input && input.url) || ''
    const options = init || {}

    // 只拦截站内 API 请求（相对路径、完整 URL 均兼容）
    const isApi = url.includes('/staticTool/api')
    // 非 API 请求、或已显式传入 signal（页面自行管理）→ 原样放行
    if (!isApi || options.signal) {
      return originalFetch(input, init)
    }

    const controller = new AbortController()
    registerRequest(controller)
    const promise = originalFetch(input, { ...options, signal: controller.signal })
    // 请求结束（成功/失败/中止）后注销
    promise.finally(() => unregisterRequest(controller))
    return promise
  }
}

/**
 * 发起 API 请求
 * @param {string} endpoint - API 路径，如 '/auth/login'
 * @param {object} options - fetch 选项
 * @returns {Promise<object>} 解析后的 JSON 响应
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_PREFIX}${endpoint}`
  const token = getAuthToken()

  // FormData 由浏览器自动生成 Content-Type（含 boundary），不能手动覆盖
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  }

  // 自动附加认证 token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 也兼容旧系统的 x-auth-token
  const oldToken = getOldAuthToken()
  if (oldToken && !token) {
    headers['x-auth-token'] = oldToken
  }

  // 请求信号管理：外部传入的 signal 优先；否则自动创建并注册到当前路由，
  // 路由离开时由 abortRouteRequests 统一中止
  let controller = null
  let signal = options.signal
  if (!signal) {
    controller = new AbortController()
    signal = controller.signal
    registerRequest(controller)
  }

  const config = {
    ...options,
    headers,
    signal
  }

  try {
    const response = await fetch(url, config)

    // 尝试解析 JSON
    let data
    try {
      data = await response.json()
    } catch {
      throw new Error(`服务器响应异常 (${response.status})`)
    }

    // 401 认证失败 — token 过期
    if (response.status === 401) {
      // 清除过期认证
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // 触发全局登出事件
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }

    return data
  } catch (err) {
    // 请求被主动中止（路由离开）时，不抛网络错误，静默返回
    if (err.name === 'AbortError') {
      throw err
    }
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络')
    }
    throw err
  } finally {
    if (controller) unregisterRequest(controller)
  }
}

/**
 * 获取旧系统 token（旅游攻略的昵称+PIN token）
 */
function getOldAuthToken() {
  try {
    const identity = localStorage.getItem('travel_user_identity')
    if (identity) {
      const parsed = JSON.parse(identity)
      return parsed.token || null
    }
  } catch { /* ignore */ }
  return null
}

/**
 * GET 请求
 */
export function get(endpoint, params = {}, options = {}) {
  let url = endpoint
  // 过滤掉 undefined/null 值，避免序列化为 "undefined" 字符串
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  )
  const query = new URLSearchParams(cleanParams).toString()
  if (query) {
    url += `?${query}`
  }
  return apiRequest(url, { method: 'GET', ...options })
}

/**
 * POST 请求（body 为 FormData 时原样传递，不 JSON 序列化）
 */
export function post(endpoint, body = {}, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  return apiRequest(endpoint, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    ...options
  })
}

/**
 * PUT 请求
 */
export function put(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
  })
}

/**
 * DELETE 请求
 */
export function del(endpoint, options = {}) {
  return apiRequest(endpoint, { method: 'DELETE', ...options })
}

export default { get, post, put, del, apiRequest }

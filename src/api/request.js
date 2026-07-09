/**
 * 统一 API 请求封装
 * 自动附加认证 token，统一错误处理
 */

const API_PREFIX = '/staticTool/api'

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

/**
 * 发起 API 请求
 * @param {string} endpoint - API 路径，如 '/auth/login'
 * @param {object} options - fetch 选项
 * @returns {Promise<object>} 解析后的 JSON 响应
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_PREFIX}${endpoint}`
  const token = getAuthToken()

  const headers = {
    'Content-Type': 'application/json',
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

  const config = {
    ...options,
    headers
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
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络')
    }
    throw err
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
export function get(endpoint, params = {}) {
  let url = endpoint
  const query = new URLSearchParams(params).toString()
  if (query) {
    url += `?${query}`
  }
  return apiRequest(url, { method: 'GET' })
}

/**
 * POST 请求
 */
export function post(endpoint, body = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/**
 * PUT 请求
 */
export function put(endpoint, body = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

/**
 * DELETE 请求
 */
export function del(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' })
}

export default { get, post, put, del, apiRequest }

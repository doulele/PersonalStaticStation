/**
 * 认证相关 API
 */
import { post, get } from './request'

/**
 * 用户登录
 * @param {string} email
 * @param {string} password
 */
export function loginApi(email, password) {
  return post('/auth/login', { email, password })
}

/**
 * 用户注册
 * @param {string} email
 * @param {string} password
 * @param {string} nickname
 */
export function registerApi(email, password, nickname) {
  return post('/auth/register', { email, password, nickname })
}

/**
 * 获取当前用户信息
 * @param {string} token - JWT token
 */
export function fetchProfileApi(token) {
  return get('/auth/profile')
}

/**
 * 修改密码
 * @param {string} oldPassword
 * @param {string} newPassword
 */
export function changePasswordApi(oldPassword, newPassword) {
  return post('/auth/change-password', { oldPassword, newPassword })
}

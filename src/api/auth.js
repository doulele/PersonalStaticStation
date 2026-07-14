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
 * @param {string} inviteCode
 */
export function registerApi(email, password, nickname, inviteCode) {
  return post('/auth/register', { email, password, nickname, inviteCode })
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

/**
 * 忘记密码 - 发送验证码到邮箱
 * @param {string} email
 */
export function forgotPasswordApi(email) {
  return post('/auth/forgot-password', { email })
}

/**
 * 重置密码 - 使用验证码重置
 * @param {string} email
 * @param {string} code
 * @param {string} newPassword
 */
export function resetPasswordApi(email, code, newPassword) {
  return post('/auth/reset-password', { email, code, newPassword })
}

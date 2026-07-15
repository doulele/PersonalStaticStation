/**
 * 认证相关 API
 */
import { post, get, put } from './request'

/**
 * 用户登录（支持邮箱或用户名）
 * @param {string} account - 邮箱或用户名
 * @param {string} password
 * @param {boolean} isUsername - 是否按用户名登录
 */
export function loginApi(account, password, isUsername = false) {
  if (isUsername) {
    return post('/auth/login', { username: account, password })
  }
  return post('/auth/login', { email: account, password })
}

/**
 * 邮箱注册
 * @param {string} email
 * @param {string} password
 * @param {string} nickname
 * @param {string} inviteCode
 */
export function registerApi(email, password, nickname, inviteCode) {
  return post('/auth/register', { email, password, nickname, inviteCode })
}

/**
 * 用户名注册（需要邀请码）
 * @param {string} username
 * @param {string} password
 * @param {string} nickname
 * @param {string} securityQuestion
 * @param {string} securityAnswer
 * @param {string} inviteCode
 */
export function registerByUsernameApi(username, password, nickname, securityQuestion, securityAnswer, inviteCode) {
  return post('/auth/register', { username, password, nickname, securityQuestion, securityAnswer, inviteCode })
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
 * 更新个人资料（昵称）
 * @param {string} nickname
 */
export function updateProfileApi(nickname) {
  return put('/auth/update-profile', { nickname })
}

/**
 * 重置密码 - 使用邮箱验证码重置
 * @param {string} email
 * @param {string} code
 * @param {string} newPassword
 */
export function resetPasswordApi(email, code, newPassword) {
  return post('/auth/reset-password', { email, code, newPassword })
}

/**
 * 忘记密码（用户名模式）- 获取密保问题
 * @param {string} username
 */
export function getSecurityQuestionApi(username) {
  return post('/auth/forgot-password-username', { username })
}

/**
 * 重置密码（用户名模式）- 验证密保答案
 * @param {string} username
 * @param {string} securityAnswer
 * @param {string} newPassword
 */
export function resetPasswordByUsernameApi(username, securityAnswer, newPassword) {
  return post('/auth/reset-password-username', { username, securityAnswer, newPassword })
}

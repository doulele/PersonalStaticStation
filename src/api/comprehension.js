/**
 * 理解力训练平台 — API
 */
import request from './request'

const BASE = '/comprehension'

// ===== 总览 / 配置 =====
export const getOverview = () => request.get(`${BASE}/overview`)
export const getProfile = () => request.get(`${BASE}/profile`)
export const saveProfile = (payload) => request.post(`${BASE}/profile`, payload)
export const saveSettings = (payload) => request.put(`${BASE}/settings`, payload)
export const doCheckin = () => request.post(`${BASE}/checkin`)

// ===== 测评 =====
export const startAssessment = (mode = 'initial') => request.post(`${BASE}/assessment/start`, { mode })
export const getAssessmentNext = () => request.get(`${BASE}/assessment/next`)
export const submitAssessmentAnswer = (payload) => request.post(`${BASE}/assessment/answer`, payload)
export const finishAssessment = (assessId) => request.post(`${BASE}/assessment/finish`, { assessId })
export const getReport = (id) => request.get(`${BASE}/assessment/report/${id}`)
export const getAssessments = () => request.get(`${BASE}/assessments`)

// ===== 训练 =====
export const generateTraining = () => request.post(`${BASE}/training/generate`)
export const getTrainingToday = () => request.get(`${BASE}/training/today`)
export const submitTraining = (payload) => request.post(`${BASE}/training/submit`, payload)
export const voteDifficulty = (payload) => request.post(`${BASE}/training/vote`, payload)

// ===== 成长 / 错题 =====
export const getGrowth = () => request.get(`${BASE}/growth`)
export const getMistakes = (dim) => request.get(`${BASE}/mistakes`, { dim })
export const retryMistake = (payload) => request.post(`${BASE}/mistakes/retry`, payload)

// ===== 专业模块 =====
export const getProStatus = () => request.get(`${BASE}/pro/status`)
export const unlockPro = () => request.post(`${BASE}/pro/unlock`)
export const startPro = (corpusId) => request.post(`${BASE}/pro/start`, { corpusId })
export const submitPro = (payload) => request.post(`${BASE}/pro/submit`, payload)

// ===== 迁移测试 =====
export const startMigrate = (type = 'same') => request.post(`${BASE}/migrate/start`, { type })
export const submitMigrate = (payload) => request.post(`${BASE}/migrate/submit`, payload)
export const getMigrateHistory = () => request.get(`${BASE}/migrate/history`)

// ===== AI =====
export const getAiQuota = () => request.get(`${BASE}/ai/quota`)
export const deepAi = (scene, payload) => request.post(`${BASE}/ai/deep`, { scene, payload })

// ===== 重置 =====
export const resetProgress = () => request.del(`${BASE}/reset`)

export default {
  getOverview, getProfile, saveProfile, saveSettings, doCheckin,
  startAssessment, getAssessmentNext, submitAssessmentAnswer, finishAssessment, getReport, getAssessments,
  generateTraining, getTrainingToday, submitTraining, voteDifficulty,
  getGrowth, getMistakes, retryMistake,
  getProStatus, unlockPro, startPro, submitPro,
  startMigrate, submitMigrate, getMigrateHistory,
  getAiQuota, deepAi, resetProgress
}

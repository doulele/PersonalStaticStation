/**
 * 永恒档案 API
 */
import { get, post, put, del, apiRequest } from './request'

const BASE = '/eternal-archive'

// ==================== 全量同步 ====================

/** 一次性拉取所有数据 */
export function syncAllFromServer() {
  return get(`${BASE}/sync-all`)
}

/** 一次性保存所有数据 */
export function syncAllToServer(data) {
  return post(`${BASE}/sync-all`, data)
}

// ==================== 文件 CRUD ====================

export function getFiles() {
  return get(`${BASE}/files`)
}

/** 上传文件（FormData） */
export async function uploadFile(formData) {
  return apiRequest(`${BASE}/files`, {
    method: 'POST',
    headers: {}, // 让浏览器自动设置 multipart/form-data
    body: formData
  })
}

export function updateFile(id, data) {
  return put(`${BASE}/files/${id}`, data)
}

export function deleteFile(id) {
  return del(`${BASE}/files/${id}`)
}

/** 批量同步文件元数据 */
export function batchSyncFiles(files) {
  return post(`${BASE}/files/batch`, { files })
}

/** 添加文件版本 */
export async function addFileVersion(id, formData) {
  return apiRequest(`${BASE}/files/${id}/versions`, {
    method: 'POST',
    headers: {},
    body: formData
  })
}

// ==================== 回收站 ====================

export function getRecycleBin() {
  return get(`${BASE}/recycle-bin`)
}

export function restoreFile(id) {
  return post(`${BASE}/recycle-bin/${id}/restore`)
}

export function destroyFile(id) {
  return del(`${BASE}/recycle-bin/${id}`)
}

// ==================== 分享管理 ====================

export function getShares() {
  return get(`${BASE}/shares`)
}

export function createShare(data) {
  return post(`${BASE}/shares`, data)
}

export function revokeShare(id) {
  return put(`${BASE}/shares/${id}/revoke`)
}

// ==================== 文件下载 ====================

export function downloadFile(id) {
  return get(`${BASE}/files/${id}/download`)
}

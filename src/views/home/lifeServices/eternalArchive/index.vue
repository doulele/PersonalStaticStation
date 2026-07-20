<template>
  <div class="ea-page">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">🏛️ 永恒档案</h1>
      <p class="page-desc">你的个人数字保险库，重要文档永不丢失</p>
    </div>

    <!-- 存储空间仪表盘 -->
    <ArchiveStats :files="files" :storage-used="storageUsed" :storage-limit="storageLimit" />

    <!-- 搜索栏 -->
    <SearchPanel v-model="searchQuery" :files="files" :tags="allTags" @search="handleSearch" />

    <!-- 操作栏 -->
    <div class="ea-action-bar">
      <div class="ea-view-switch">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="list"><el-icon><List /></el-icon> 列表</el-radio-button>
          <el-radio-button value="grid"><el-icon><Grid /></el-icon> 卡片</el-radio-button>
          <el-radio-button value="timeline"><el-icon><Clock /></el-icon> 时间胶囊</el-radio-button>
        </el-radio-group>
      </div>
      <div class="ea-actions">
        <el-button @click="showRecycleBin = true">
          <el-icon><Delete /></el-icon> 回收站 ({{ recycleBin.length }})
        </el-button>
        <el-button @click="showShareManage = true">
          <el-icon><Share /></el-icon> 我的分享
        </el-button>
        <el-button type="primary" @click="showUpload = true" class="upload-btn">
          <el-icon><Upload /></el-icon> 上传档案
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ea-content">
      <!-- 列表视图 -->
      <FileList
        v-if="viewMode === 'list'"
        :files="displayFiles"
        @preview="openPreview"
        @detail="openDetail"
        @delete="handleDelete"
        @share="openShare"
        @archive="handleArchive"
      />

      <!-- 卡片/瀑布流视图 -->
      <FileGrid
        v-if="viewMode === 'grid'"
        :files="displayFiles"
        @preview="openPreview"
        @detail="openDetail"
        @delete="handleDelete"
        @share="openShare"
        @archive="handleArchive"
      />

      <!-- 时间胶囊视图 -->
      <TimelineView
        v-if="viewMode === 'timeline'"
        :files="displayFiles"
        @preview="openPreview"
        @detail="openDetail"
      />
    </div>

    <!-- 弹窗组件 -->
    <FileUpload
      v-model:visible="showUpload"
      :files="files"
      @uploaded="handleFileUploaded"
    />

    <FilePreview
      v-model:visible="showPreview"
      :file="previewFile"
    />

    <FileDetail
      v-model:visible="showDetail"
      :file="detailFile"
      :files="files"
      @update="handleFileUpdate"
      @delete="handleDelete"
      @share="openShare"
      @create-task="handleCreateTaskFromFile"
    />

    <ShareDialog
      v-model:visible="showShare"
      :file="shareFile"
      @shared="handleFileShared"
    />

    <RecycleBin
      v-model:visible="showRecycleBin"
      :files="recycleBin"
      @restore="handleRestore"
      @destroy="handleDestroy"
    />

    <ShareManage
      v-model:visible="showShareManage"
      :shares="activeShares"
      @revoke="handleRevokeShare"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, List, Grid, Clock, Delete, Share, Upload, FolderOpened
} from '@element-plus/icons-vue'

import ArchiveStats from './components/ArchiveStats.vue'
import SearchPanel from './components/SearchPanel.vue'
import FileList from './components/FileList.vue'
import FileGrid from './components/FileGrid.vue'
import TimelineView from './components/TimelineView.vue'
import FileUpload from './components/FileUpload.vue'
import FilePreview from './components/FilePreview.vue'
import FileDetail from './components/FileDetail.vue'
import ShareDialog from './components/ShareDialog.vue'
import RecycleBin from './components/RecycleBin.vue'
import ShareManage from './components/ShareManage.vue'
import * as eaApi from '@/api/eternalArchive'

const router = useRouter()
const store = useStore()

const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])
const useBackend = computed(() => isLoggedIn.value)

// ==================== 数据管理 ====================
const files = ref(loadFiles())
const recycleBin = ref(loadRecycleBin())
const activeShares = ref(loadShares())
const storageLimit = 500 // MB

const storageUsed = computed(() => {
  return files.value.reduce((sum, f) => sum + (f.size || 0), 0) / (1024 * 1024)
})

const allTags = computed(() => {
  const tagSet = new Set()
  files.value.forEach(f => {
    if (f.tags) f.tags.forEach(t => tagSet.add(t))
    if (f.category) tagSet.add(f.category)
  })
  return [...tagSet]
})

function loadFiles() {
  try { return JSON.parse(localStorage.getItem('ea_files') || '[]') } catch { return [] }
}
function loadRecycleBin() {
  try { return JSON.parse(localStorage.getItem('ea_recycleBin') || '[]') } catch { return [] }
}
function loadShares() {
  try { return JSON.parse(localStorage.getItem('ea_shares') || '[]') } catch { return [] }
}

function saveFiles() {
  localStorage.setItem('ea_files', JSON.stringify(files.value))
  syncToBackend()
}
function saveRecycleBin() {
  localStorage.setItem('ea_recycleBin', JSON.stringify(recycleBin.value))
  syncToBackend()
}
function saveShares() {
  localStorage.setItem('ea_shares', JSON.stringify(activeShares.value))
  syncToBackend()
}

// 后端同步（节流）
let syncTimer = null
function syncToBackend() {
  if (!useBackend.value) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      await eaApi.syncAllToServer({
        files: files.value,
        recycleBin: recycleBin.value,
        shares: activeShares.value
      })
    } catch (err) {
      console.warn('[EternalArchive] 后端同步失败:', err.message)
    }
  }, 2000)
}

// 从后端加载数据
async function loadFromBackend() {
  if (!useBackend.value) return
  try {
    const res = await eaApi.syncAllFromServer()
    if (res.success && res.data) {
      const { files: srvFiles, recycleBin: srvBin, shares: srvShares } = res.data
      if (srvFiles && srvFiles.length > 0) {
        files.value = srvFiles
        localStorage.setItem('ea_files', JSON.stringify(srvFiles))
      }
      if (srvBin && srvBin.length > 0) {
        recycleBin.value = srvBin
        localStorage.setItem('ea_recycleBin', JSON.stringify(srvBin))
      }
      if (srvShares && srvShares.length > 0) {
        activeShares.value = srvShares
        localStorage.setItem('ea_shares', JSON.stringify(srvShares))
      }
    }
  } catch (err) {
    console.warn('[EternalArchive] 后端加载失败，使用本地数据:', err.message)
  }
}

// ==================== 视图与搜索 ====================
const viewMode = ref('grid')
const searchQuery = ref('')
const activeFilters = ref({})

const displayFiles = computed(() => {
  let list = files.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.tags?.some(t => t.toLowerCase().includes(q)) ||
      f.category?.toLowerCase().includes(q) ||
      f.ocrText?.toLowerCase().includes(q)
    )
  }

  if (activeFilters.value.level) {
    list = list.filter(f => f.securityLevel === activeFilters.value.level)
  }
  if (activeFilters.value.category) {
    list = list.filter(f => f.category === activeFilters.value.category)
  }

  return list
})

function handleSearch(query, filters) {
  searchQuery.value = query
  activeFilters.value = filters || {}
}

// ==================== 上传 ====================
function handleFileUploaded(fileDataList) {
  fileDataList.forEach(fd => {
    files.value.push({
      id: 'ea_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: fd.name,
      description: fd.description || '',
      category: fd.category || '其他',
      tags: fd.tags || [],
      securityLevel: fd.securityLevel || 'B',
      size: fd.size || 0,
      type: fd.type || 'application/octet-stream',
      uploadDate: new Date().toISOString(),
      updateDate: new Date().toISOString(),
      versions: [{ id: 'v1', date: new Date().toISOString(), note: '初始版本', name: fd.name }],
      versionChain: fd.versionChain || null,
      ocrText: fd.ocrText || '',
      relatedTasks: [],
      freshUntil: fd.freshUntil || null,
      isColdStorage: false,
      viewCount: 0,
      downloadCount: 0
    })
  })
  saveFiles()
  ElMessage.success(`成功归档 ${fileDataList.length} 个档案 ✨`)
}

// ==================== 文件操作 ====================
const showUpload = ref(false)
const showPreview = ref(false)
const showDetail = ref(false)
const showShare = ref(false)
const showRecycleBin = ref(false)
const showShareManage = ref(false)
const previewFile = ref(null)
const detailFile = ref(null)
const shareFile = ref(null)

function openPreview(file) {
  previewFile.value = file
  showPreview.value = true
  // 增加查看计数
  const idx = files.value.findIndex(f => f.id === file.id)
  if (idx >= 0) files.value[idx].viewCount = (files.value[idx].viewCount || 0) + 1
  saveFiles()
}

function openDetail(file) {
  detailFile.value = { ...file }
  showDetail.value = true
}

function handleFileUpdate(updated) {
  const idx = files.value.findIndex(f => f.id === updated.id)
  if (idx >= 0) {
    files.value[idx] = { ...files.value[idx], ...updated, updateDate: new Date().toISOString() }
    saveFiles()
    ElMessage.success('档案已更新')
  }
}

async function handleDelete(file) {
  try {
    await ElMessageBox.confirm(
      `确定要将「${file.name}」移入回收站吗？`,
      '删除确认',
      { confirmButtonText: '移入回收站', cancelButtonText: '取消', type: 'warning' }
    )
    files.value = files.value.filter(f => f.id !== file.id)
    recycleBin.value.push({
      ...file,
      deletedAt: new Date().toISOString(),
      retentionDays: file.securityLevel === 'S' ? 60 : file.securityLevel === 'A' ? 30 : 15
    })
    saveFiles()
    saveRecycleBin()
    ElMessage.success('已移入回收站')
  } catch { /* 取消 */ }
}

function handleArchive(file) {
  const idx = files.value.findIndex(f => f.id === file.id)
  if (idx >= 0) {
    files.value[idx].isColdStorage = !files.value[idx].isColdStorage
    saveFiles()
    ElMessage.success(files.value[idx].isColdStorage ? '已移入冷存储' : '已从冷存储恢复')
  }
}

function handleRestore(file) {
  recycleBin.value = recycleBin.value.filter(f => f.id !== file.id)
  const { deletedAt, retentionDays, ...rest } = file
  files.value.push(rest)
  saveFiles()
  saveRecycleBin()
  ElMessage.success('档案已恢复')
}

async function handleDestroy(file) {
  try {
    await ElMessageBox.confirm(
      '此操作将永久销毁该文件，不可恢复！',
      '⚠️ 永久删除',
      { confirmButtonText: '确认永久删除', cancelButtonText: '取消', type: 'error' }
    )
    recycleBin.value = recycleBin.value.filter(f => f.id !== file.id)
    saveRecycleBin()
    ElMessage.success('已永久销毁')
  } catch { /* 取消 */ }
}

// ==================== 分享 ====================
function openShare(file) {
  shareFile.value = file
  showShare.value = true
}

function handleFileShared(shareData) {
  activeShares.value.push({
    id: 'share_' + Date.now(),
    fileId: shareFile.value.id,
    fileName: shareFile.value.name,
    ...shareData,
    createdAt: new Date().toISOString(),
    status: 'active'
  })
  saveShares()
}

function handleRevokeShare(share) {
  activeShares.value = activeShares.value.filter(s => s.id !== share.id)
  saveShares()
  ElMessage.success('分享链接已撤回')
}

// ==================== 与任务炼金术士联动 ====================
function handleCreateTaskFromFile(file) {
  // 跳转到任务炼金术士并预设任务
  const taskData = {
    title: `处理 ${file.name}`,
    description: `来自永恒档案：${file.name}`,
    fileRef: file.id,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  }
  localStorage.setItem('ea_pending_task', JSON.stringify(taskData))
  router.push('/home/lifeServices/taskAlchemist')
}

// 检查是否有待创建的任务
onMounted(async () => {
  // 从后端加载数据
  await loadFromBackend()
  cleanExpiredRecycleBin()
})

// 清理过期回收站
function cleanExpiredRecycleBin() {
  const now = Date.now()
  const cleaned = recycleBin.value.filter(f => {
    const age = (now - new Date(f.deletedAt).getTime()) / (1000 * 60 * 60 * 24)
    return age < f.retentionDays
  })
  if (cleaned.length !== recycleBin.value.length) {
    recycleBin.value = cleaned
    saveRecycleBin()
  }
}

function goBack() {
  router.push('/home/lifeServices')
}
</script>

<style lang="scss" scoped>
.ea-page {
  padding: 40px 32px;
  max-width: 1200px;
  width: 80%;
  margin: 0 auto;
  box-sizing: border-box;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.back-bar { margin-bottom: 16px; }
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  &:hover { color: #0d9488; background: #f0fdfa; }
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}
.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.page-desc {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.ea-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}
.ea-view-switch {}
.ea-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.upload-btn {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  border: none;
  &:hover { background: linear-gradient(135deg, #0f766e, #0d9488); }
}

.ea-content {
  min-height: 400px;
}

@media (max-width: 768px) {
  .ea-page {
    padding: 16px 12px 80px;
    width: 100%;
    max-width: 100%;
  }
  .page-title { font-size: 24px; }
  .page-desc { font-size: 13px; }
  .ea-action-bar { flex-direction: column; align-items: stretch; }
  .ea-actions { justify-content: flex-end; }
}

html.dark-mode & {
  .page-title { color: #e2dee9; }
  .page-desc { color: #94a3b8; }
  .back-btn { color: #94a3b8; &:hover { color: #14b8a6; background: #0d2a26; } }
}
</style>

<template>
  <div class="vip-video-parse-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">📺 VIP视频解析</h1>
        <p class="page-desc">粘贴视频链接，免费在线观看VIP视频</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <!-- URL输入框 -->
      <div class="input-box">
        <el-icon class="input-icon" :size="20"><Link /></el-icon>
        <input
          v-model="videoUrl"
          class="url-input"
          placeholder="粘贴VIP视频播放链接（支持腾讯、爱奇艺、优酷、芒果等）"
          @keydown.enter="handleParse"
        />
        <el-icon v-if="videoUrl" class="clear-icon" :size="18" @click="clearUrl">
          <CircleClose />
        </el-icon>
      </div>

      <!-- 解析路径选择 -->
      <div class="parse-line-select" v-if="userLines.length > 0">
        <span class="line-select-label">解析路径：</span>
        <div class="line-select-dropdown">
          <div
            class="line-select-trigger"
            :class="{ open: lineDropdownOpen }"
            @click="lineDropdownOpen = !lineDropdownOpen"
          >
            <span class="selected-line-name">
              <span class="status-dot" :class="getLineHealthStatus(userLines[selectedLineIndex]?.name)"></span>
              {{ userLines[selectedLineIndex]?.name || '选择解析路径' }}
            </span>
            <el-icon :size="16" class="dropdown-arrow" :class="{ rotated: lineDropdownOpen }">
              <ArrowDown />
            </el-icon>
          </div>
          <transition name="dropdown-fade">
            <div v-if="lineDropdownOpen" class="line-select-options">
              <div class="dropdown-header">
                <span>选择解析线路</span>
                <span class="refresh-health" :class="{ refreshing: healthChecking }" @click.stop="checkApiHealth">
                  <el-icon :size="14"><Refresh /></el-icon>
                  {{ healthChecking ? '检测中...' : '刷新检测' }}
                </span>
              </div>
              <div
                v-for="(line, idx) in userLines"
                :key="idx"
                class="line-option"
                :class="{ active: selectedLineIndex === idx }"
                @click="selectLine(idx)"
              >
                <div class="line-option-top">
                  <span class="status-dot" :class="getLineHealthStatus(line.name)"></span>
                  <span class="line-option-name">{{ line.name }}</span>
                  <span v-if="apiHealthMap[line.name]?.responseTime" class="line-option-ping">{{ apiHealthMap[line.name].responseTime }}ms</span>
                </div>
                <span class="line-option-api">{{ line.api }}</span>
              </div>
            </div>
          </transition>
        </div>
        <!-- 管理入口 -->
        <button class="manage-lines-btn" @click="showLineManage = true" title="管理解析路径">
          <el-icon :size="16"><Setting /></el-icon>
        </button>
      </div>

      <div class="input-actions">
        <button class="parse-btn" :disabled="!videoUrl.trim()" :class="{ loading: parsing }" @click="handleParse">
          <el-icon v-if="!parsing" :size="18"><VideoPlay /></el-icon>
          <el-icon v-else class="is-loading" :size="18"><Loading /></el-icon>
          <span>{{ parsing ? '解析中...' : '立即解析' }}</span>
        </button>
      </div>

      <!-- 支持的平台 -->
      <div class="platform-tags">
        <span class="platform-label">支持平台：</span>
        <span v-for="p in platforms" :key="p.name" class="platform-chip" :style="{ '--pf-color': p.color }">
          {{ p.name }}
        </span>
      </div>
    </div>

    <!-- 视频播放区 -->
    <div v-if="showPlayer" class="player-section">
      <div class="player-container">
        <div class="player-header">
          <span class="player-title">{{ parsedTitle || '正在播放' }}</span>
          <div class="line-switcher" v-if="userLines.length > 1">
            <span class="line-label">播放线路：</span>
            <button
              v-for="(line, idx) in userLines"
              :key="idx"
              class="line-btn"
              :class="{ active: currentLine === idx }"
              @click="currentLine = idx"
            >{{ line.name }}</button>
          </div>
        </div>

        <!-- iframe 播放 -->
        <div class="video-wrapper">
          <iframe
            v-if="currentPlayUrl"
            :src="currentPlayUrl"
            class="video-iframe"
            frameborder="0"
            allowfullscreen
            allow="autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          ></iframe>
          <div v-else class="video-placeholder">
            <el-icon :size="64"><VideoCamera /></el-icon>
            <p>输入视频链接开始播放</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length" class="history-section">
      <div class="history-header">
        <h3>📋 播放记录</h3>
        <el-button text size="small" type="danger" @click="clearHistory">清空记录</el-button>
      </div>
      <div class="history-list">
        <div
          v-for="(item, idx) in history"
          :key="idx"
          class="history-item"
          @click="replayFromHistory(item)"
        >
          <span class="history-index">{{ idx + 1 }}</span>
          <span class="history-title">{{ item.title || '未命名视频' }}</span>
          <span class="history-time">{{ item.time }}</span>
          <el-icon class="history-play" :size="14"><VideoPlay /></el-icon>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="tips-section">
      <h3>💡 使用说明</h3>
      <ul class="tips-list">
        <li>支持腾讯视频、爱奇艺、优酷、芒果TV、B站等主流视频平台的VIP视频解析</li>
        <li>输入视频链接，选择合适的解析路径，点击"立即解析"即可观看</li>
        <li>可点击解析路径旁的设置按钮，自行添加、修改或删除解析接口</li>
        <li>如遇到无法播放的情况，请尝试切换播放线路</li>
        <li>解析接口由第三方提供，仅供学习交流使用，请勿用于商业用途</li>
      </ul>
    </div>

    <!-- 解析路径管理弹窗 -->
    <el-dialog
      v-model="showLineManage"
      title="管理解析路径"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="line-manage-panel">
        <!-- 添加新路径 -->
        <div class="line-manage-add">
          <div class="add-inputs">
            <input
              v-model="newLineName"
              class="add-input"
              placeholder="线路名称（如：线路四）"
              @keydown.enter="addNewLine"
            />
            <input
              v-model="newLineApi"
              class="add-input add-input-api"
              placeholder="解析接口地址（如：https://jx.xxx.com/?url=）"
              @keydown.enter="addNewLine"
            />
          </div>
          <button class="add-btn" :disabled="!newLineName.trim() || !newLineApi.trim()" @click="addNewLine">
            <el-icon :size="16"><Plus /></el-icon>
            <span>添加</span>
          </button>
        </div>

        <!-- 路径列表 -->
        <div class="line-manage-list" v-if="userLines.length > 0">
          <div class="line-manage-header">
            <span class="lmh-name">线路名称</span>
            <span class="lmh-api">解析接口地址</span>
            <span class="lmh-actions">操作</span>
          </div>
          <div
            v-for="(line, idx) in userLines"
            :key="idx"
            class="line-manage-item"
          >
            <template v-if="editingLineIndex === idx">
              <input v-model="editLineName" class="edit-input" placeholder="线路名称" />
              <input v-model="editLineApi" class="edit-input edit-input-api" placeholder="解析接口地址" />
              <div class="edit-actions">
                <el-button size="small" type="success" @click="saveEditLine">保存</el-button>
                <el-button size="small" @click="cancelEditLine">取消</el-button>
              </div>
            </template>
            <template v-else>
              <span class="lm-item-name">
                <span class="status-dot" :class="getLineHealthStatus(line.name)"></span>
                {{ line.name }}
              </span>
              <span class="lm-item-api">{{ line.api }}</span>
              <div class="lm-item-actions">
                <el-button text size="small" type="primary" @click="startEditLine(idx)">编辑</el-button>
                <el-button text size="small" type="danger" @click="deleteLine(idx)" :disabled="userLines.length <= 1">删除</el-button>
              </div>
            </template>
          </div>
        </div>

        <div v-else class="line-manage-empty">
          <p>暂无自定义解析路径，请添加</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="checkApiHealth" :disabled="healthChecking">
            {{ healthChecking ? '检测中...' : '健康检测' }}
          </el-button>
          <div>
            <el-button @click="showLineManage = false">关闭</el-button>
            <el-button type="warning" @click="resetLines" v-if="hasCustomLines">恢复默认</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  ArrowLeft, Link, CircleClose, VideoPlay, Loading, VideoCamera,
  ArrowDown, Setting, Plus, Refresh
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ==================== 输入状态 ====================
const videoUrl = ref('')
const parsing = ref(false)
const showPlayer = ref(false)
const parsedTitle = ref('')

// ==================== 解析路径 ====================
const defaultLines = [
  { name: '线路一', api: 'https://jx.m3u8.tv/jiexi/?url=' },
  { name: '线路二', api: 'https://vip.bljiex.com/?v=' },
  { name: '线路三', api: 'https://jx.618g.com/?url=' },
  { name: '线路四', api: 'https://z1.m1907.top/?jx=' },
  { name: '线路五', api: 'https://jx.playerjx.com/?url=' },
  { name: '线路六', api: 'https://jx.nnxv.cn/tv.php?url=' },
  { name: '线路七', api: 'https://www.8090g.cn/jiexi/?url=' },
  { name: '线路八', api: 'https://www.playm3u8.cn/jiexi.php?url=' }
]

// 用户自定义解析路径（从localStorage加载）
const userLines = ref(loadUserLines())
const selectedLineIndex = ref(0)
const currentLine = ref(0)
const lineDropdownOpen = ref(false)

// ==================== 后端健康检测 ====================
const apiHealthMap = ref({})       // { '线路一': { online, responseTime }, ... }
const healthChecking = ref(false)
const healthChecked = ref(false)

async function checkApiHealth() {
  healthChecking.value = true
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const res = await fetch('/staticTool/api/video-parse/check-apis', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const data = await res.json()
    if (data?.code === 0 && data.data) {
      const map = {}
      data.data.results.forEach(r => {
        map[r.name] = { online: r.online, responseTime: r.responseTime }
      })
      apiHealthMap.value = map
    }
  } catch (err) {
    console.warn('健康检测失败（后端未启动）:', err.message)
    const map = {}
    userLines.value.forEach(l => { map[l.name] = { online: null, responseTime: null } })
    apiHealthMap.value = map
  } finally {
    healthChecking.value = false
    healthChecked.value = true
  }
}

function getLineHealthStatus(lineName) {
  const h = apiHealthMap.value[lineName]
  if (!h || h.online === null) return 'unknown'
  return h.online ? 'online' : 'offline'
}

function loadUserLines() {
  try {
    const saved = localStorage.getItem('vip_video_parse_lines')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [...defaultLines]
}

function saveUserLines() {
  try {
    localStorage.setItem('vip_video_parse_lines', JSON.stringify(userLines.value))
  } catch { /* ignore */ }
}

const hasCustomLines = computed(() => {
  try {
    const saved = localStorage.getItem('vip_video_parse_lines')
    return !!saved
  } catch { return false }
})

// ==================== 解析路径管理 ====================
const showLineManage = ref(false)
const newLineName = ref('')
const newLineApi = ref('')
const editingLineIndex = ref(-1)
const editLineName = ref('')
const editLineApi = ref('')

function selectLine(idx) {
  selectedLineIndex.value = idx
  lineDropdownOpen.value = false
}

function addNewLine() {
  const name = newLineName.value.trim()
  const api = newLineApi.value.trim()
  if (!name) { ElMessage.warning('请输入线路名称'); return }
  if (!api) { ElMessage.warning('请输入解析接口地址'); return }
  if (!api.startsWith('http')) { ElMessage.warning('解析接口地址必须以 http:// 或 https:// 开头'); return }
  if (!api.includes('?url=') && !api.includes('?v=')) {
    ElMessage.warning('解析接口地址应包含 ?url= 参数占位符（如 ?url=）');
    return
  }

  userLines.value.push({ name, api })
  saveUserLines()
  newLineName.value = ''
  newLineApi.value = ''
  ElMessage.success('解析路径添加成功！')
}

function startEditLine(idx) {
  editingLineIndex.value = idx
  editLineName.value = userLines.value[idx].name
  editLineApi.value = userLines.value[idx].api
}

function saveEditLine() {
  const idx = editingLineIndex.value
  if (idx < 0 || idx >= userLines.value.length) return
  const name = editLineName.value.trim()
  const api = editLineApi.value.trim()
  if (!name) { ElMessage.warning('请输入线路名称'); return }
  if (!api) { ElMessage.warning('请输入解析接口地址'); return }

  userLines.value[idx] = { name, api }
  saveUserLines()
  editingLineIndex.value = -1
  ElMessage.success('修改成功！')
}

function cancelEditLine() {
  editingLineIndex.value = -1
}

function deleteLine(idx) {
  if (userLines.value.length <= 1) {
    ElMessage.warning('至少保留一条解析路径')
    return
  }
  ElMessageBox.confirm(`确定删除"${userLines.value[idx].name}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userLines.value.splice(idx, 1)
    saveUserLines()
    // 调整选中索引
    if (selectedLineIndex.value >= userLines.value.length) {
      selectedLineIndex.value = userLines.value.length - 1
    }
    ElMessage.success('删除成功！')
  }).catch(() => {})
}

function resetLines() {
  ElMessageBox.confirm('确定恢复默认解析路径吗？当前自定义路径将被覆盖。', '恢复默认', {
    confirmButtonText: '确定恢复',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userLines.value = [...defaultLines]
    selectedLineIndex.value = 0
    currentLine.value = 0
    localStorage.removeItem('vip_video_parse_lines')
    ElMessage.success('已恢复默认解析路径')
  }).catch(() => {})
}

// ==================== 平台标签 ====================
const platforms = [
  { name: '腾讯视频', color: '#0052d9' },
  { name: '爱奇艺', color: '#00be06' },
  { name: '优酷', color: '#00a0e9' },
  { name: '芒果TV', color: '#ff6600' },
  { name: 'B站', color: '#fb7299' },
  { name: '其他', color: '#6b7280' }
]

// ==================== 播放历史 ====================
const history = ref(loadHistory())

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_video_history') || '[]')
  } catch { return [] }
}

function saveHistory(item) {
  const list = [item, ...history.value.filter(h => h.url !== item.url)].slice(0, 20)
  history.value = list
  try {
    localStorage.setItem('vip_video_history', JSON.stringify(list))
  } catch { /* ignore */ }
}

function clearHistory() {
  history.value = []
  try { localStorage.removeItem('vip_video_history') } catch { /* ignore */ }
  ElMessage.success('播放记录已清空')
}

function clearUrl() {
  videoUrl.value = ''
}

function isValidUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

function handleParse() {
  const url = videoUrl.value.trim()
  if (!url) {
    ElMessage.warning('请先粘贴视频链接')
    return
  }

  if (!isValidUrl(url)) {
    ElMessage.warning('请输入有效的视频链接（以 http:// 或 https:// 开头）')
    return
  }

  if (userLines.value.length === 0) {
    ElMessage.warning('请先添加解析路径')
    return
  }

  parsing.value = true
  // 使用选中的线路作为默认播放线路
  currentLine.value = selectedLineIndex.value

  // 模拟解析过程
  setTimeout(() => {
    const titleMatch = url.match(/title=([^&]+)/)
    parsedTitle.value = titleMatch ? decodeURIComponent(titleMatch[1]) : 'VIP视频'

    showPlayer.value = true
    parsing.value = false

    // 保存历史
    saveHistory({
      url,
      title: parsedTitle.value,
      time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })

    ElMessage.success('解析成功！开始播放')
  }, 800)
}

function replayFromHistory(item) {
  videoUrl.value = item.url
  handleParse()
}

// ==================== 计算属性 ====================
// 从用户自定义路径中解析，优先使用当前切换的线路
const currentPlayUrl = computed(() => {
  if (!showPlayer.value) return ''
  const url = videoUrl.value.trim()
  if (!url || userLines.value.length === 0) return ''
  const idx = Math.min(currentLine.value, userLines.value.length - 1)
  return userLines.value[idx].api + encodeURIComponent(url)
})

// 点击外部关闭下拉
function handleClickOutside(e) {
  const target = e.target
  if (!target.closest('.line-select-dropdown')) {
    lineDropdownOpen.value = false
  }
}

// 注册/移除全局点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 页面加载时进行健康检测
  checkApiHealth()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.vip-video-parse-page {
  padding: 40px 24px;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}
.back-btn { flex-shrink: 0; }
.header-center { flex: 1; text-align: center; }
.header-spacer { flex-shrink: 0; width: 60px; }

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.page-desc { font-size: 16px; color: #64748b; }

// Input section
.input-section { margin-bottom: 32px; }

.input-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 0 16px;
  height: 56px;
  transition: all 0.3s;
  margin-bottom: 12px;
  &:focus-within { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.12); }
}
.input-icon { color: #94a3b8; margin-right: 12px; flex-shrink: 0; }
.url-input {
  flex: 1; border: none; outline: none; font-size: 15px; color: #0f172a; background: transparent; min-width: 0;
  &::placeholder { color: #94a3b8; font-size: 14px; }
}
.clear-icon { color: #94a3b8; cursor: pointer; flex-shrink: 0; &:hover { color: #64748b; } }

// 解析路径选择
.parse-line-select {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 0;
  margin-bottom: 8px;
}
.line-select-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}
.line-select-dropdown {
  position: relative;
  flex: 1;
  min-width: 0;
}
.line-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #0f172a;
  transition: all 0.2s;
  &:hover, &.open { border-color: #6366f1; background: #f0f0ff; }
}
.selected-line-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dropdown-arrow { color: #94a3b8; transition: transform 0.2s; &.rotated { transform: rotate(180deg); } }

.line-select-options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}
.line-option {
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 2px;
  &:first-child { border-radius: 0; }
  &:last-child { border-radius: 0 0 12px 12px; }
  &:hover { background: #f8fafc; }
  &.active { background: #f0f0ff; .line-option-name { color: #6366f1; } }
}
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
}
.refresh-health {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #6366f1;
  font-size: 11px;
  &:hover { color: #4f46e5; }
  &.refreshing { opacity: 0.6; cursor: not-allowed; }
}
.line-option-top {
  display: flex;
  align-items: center;
  gap: 6px;
}
.line-option-name { font-size: 14px; font-weight: 500; color: #0f172a; }
.line-option-ping {
  font-size: 11px;
  color: #94a3b8;
  margin-left: auto;
}
.line-option-api {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 14px;
}

// 健康状态指示点
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #cbd5e1;
  &.online { background: #22c55e; box-shadow: 0 0 4px rgba(34,197,94,0.5); }
  &.offline { background: #ef4444; box-shadow: 0 0 4px rgba(239,68,68,0.5); }
  &.unknown { background: #cbd5e1; }
}

.manage-lines-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { border-color: #6366f1; color: #6366f1; background: #f0f0ff; }
}

.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: all 0.2s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

.input-actions { margin-top: 16px; text-align: center; }

.parse-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 40px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.platform-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  justify-content: center;
}
.platform-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
.platform-chip {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--pf-color);
  background: color-mix(in srgb, var(--pf-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--pf-color) 30%, transparent);
}

// Player
.player-section { margin-bottom: 40px; }

.player-container {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}
.player-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.line-switcher { display: flex; align-items: center; gap: 6px; }
.line-label { font-size: 12px; color: #94a3b8; }
.line-btn {
  padding: 3px 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #6366f1; color: #6366f1; }
  &.active { background: #6366f1; color: #fff; border-color: #6366f1; }
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
  gap: 12px;
  p { font-size: 14px; color: #94a3b8; }
}

// History
.history-section { margin-bottom: 40px; }
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f0f0ff; }
}
.history-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}
.history-title {
  flex: 1;
  font-size: 14px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-time { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.history-play { color: #6366f1; flex-shrink: 0; }

// Tips
.tips-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
}
.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  li { font-size: 14px; color: #64748b; line-height: 1.6; }
}

// 解析路径管理弹窗
.line-manage-panel {
  .line-manage-add {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
  .add-inputs { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .add-input {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    color: #0f172a;
    outline: none;
    background: #fff;
    transition: border-color 0.2s;
    &:focus { border-color: #6366f1; }
    &::placeholder { color: #94a3b8; font-size: 12px; }
  }
  .add-input-api { font-size: 12px; }
  .add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    margin-top: 4px;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .line-manage-list {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }
  .line-manage-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .lmh-name { flex: 0 0 100px; }
  .lmh-api { flex: 1; }
  .lmh-actions { flex: 0 0 100px; text-align: center; }

  .line-manage-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    &:last-child { border-bottom: none; }
    .lm-item-name { flex: 0 0 120px; font-size: 14px; font-weight: 500; color: #0f172a; display: flex; align-items: center; gap: 6px; }
    .lm-item-api {
      flex: 1;
      font-size: 12px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lm-item-actions { flex: 0 0 100px; display: flex; gap: 4px; justify-content: center; }
    .edit-input {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      color: #0f172a;
      outline: none;
      &:focus { border-color: #6366f1; }
      &.edit-input-api { flex: 1; font-size: 12px; }
    }
    .edit-input:first-of-type { flex: 0 0 100px; }
    .edit-actions { flex: 0 0 auto; display: flex; gap: 6px; }
  }

  .line-manage-empty {
    text-align: center;
    padding: 40px 20px;
    p { font-size: 14px; color: #94a3b8; }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}

// Responsive - 平板
@media (max-width: 768px) {
  .vip-video-parse-page { padding: 20px 16px; }
  .page-header { margin-bottom: 20px; flex-wrap: wrap; }
  .header-spacer { display: none; }
  .back-btn { padding: 4px; }
  .page-title { font-size: 24px; }
  .page-desc { font-size: 14px; }

  .input-box { height: 48px; border-radius: 12px; padding: 0 12px; }
  .url-input { font-size: 14px; &::placeholder { font-size: 13px; } }
  .input-icon { margin-right: 8px; }
  .parse-btn { padding: 12px 28px; font-size: 15px; border-radius: 12px; }
  .platform-tags { gap: 6px; }
  .platform-label { font-size: 12px; }
  .platform-chip { font-size: 11px; padding: 2px 10px; }

  .player-container { border-radius: 12px; }
  .player-header { flex-direction: column; align-items: flex-start; padding: 12px 14px; gap: 8px; }
  .player-title { font-size: 14px; }
  .line-switcher { flex-wrap: wrap; }

  .history-header h3 { font-size: 16px; }
  .history-item { padding: 8px 10px; }
  .history-title { font-size: 13px; }
  .history-time { font-size: 11px; }

  .tips-section { padding: 16px; border-radius: 12px; }
  .tips-section h3 { font-size: 15px; }
  .tips-list li { font-size: 13px; }

  .line-select-label { font-size: 12px; }
  .line-select-trigger { padding: 6px 10px; border-radius: 8px; font-size: 13px; }
  .manage-lines-btn { width: 32px; height: 32px; border-radius: 8px; }

  .line-manage-panel {
    .line-manage-add { flex-direction: column; padding: 12px; gap: 8px; }
    .add-btn { margin-top: 0; align-self: flex-end; }
    .line-manage-header { display: none; }
    .line-manage-item { flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
    .lm-item-name, .lm-item-api { flex: 1 1 auto; min-width: 120px; }
    .lm-item-api { font-size: 11px; }
    .lm-item-actions { flex: 0 0 auto; }
    .edit-input { font-size: 12px; padding: 4px 8px; }
  }
}

// Responsive - 手机
@media (max-width: 480px) {
  .vip-video-parse-page { padding: 16px 12px; }
  .page-header { margin-bottom: 16px; }
  .page-title { font-size: 22px; }
  .page-desc { font-size: 13px; }

  .input-section { margin-bottom: 20px; }
  .input-box { height: 44px; border-radius: 10px; padding: 0 10px; }
  .url-input { font-size: 13px; &::placeholder { font-size: 12px; } }
  .input-icon { margin-right: 6px; }

  .parse-btn { width: 100%; justify-content: center; padding: 12px 20px; font-size: 14px; }

  .parse-line-select { flex-wrap: wrap; gap: 6px; }
  .line-select-label { width: 100%; }
  .line-select-dropdown { flex: 1; }
  .line-select-trigger { font-size: 12px; padding: 6px 8px; }

  .platform-tags { gap: 4px; }
  .platform-chip { font-size: 10px; padding: 2px 8px; }

  .player-section { margin-bottom: 24px; }
  .video-wrapper { aspect-ratio: 4 / 3; }
  .player-header { padding: 10px 12px; }
  .line-btn { padding: 2px 8px; font-size: 11px; }

  .history-section { margin-bottom: 24px; }
  .history-index { width: 20px; height: 20px; font-size: 11px; }
  .history-play { display: none; }
  .history-time { display: none; }

  .tips-section { padding: 12px; }
  .tips-list { padding-left: 16px; gap: 6px; }
  .tips-list li { font-size: 12px; }
}
</style>

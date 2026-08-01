<template>
  <div class="url-parse-panel">
    <!-- 融合搜索框容器：输入框 + 线路选择 + 解析按钮 一行，下拉面板定位参照 -->
    <div class="parse-fused-wrap">
      <div class="parse-fused">
        <input
          v-model="videoUrl"
          class="url-input"
          placeholder="粘贴视频播放链接（支持腾讯、爱奇艺、优酷、芒果等）"
          @keydown.enter="handleParse"
        />
        <el-icon v-if="videoUrl" class="clear-icon" :size="18" @click="videoUrl = ''">
          <CircleClose />
        </el-icon>
        <span class="fused-divider"></span>
        <!-- 线路选择（与 VIP 线路一致），下拉面板作为其定位参照居中 -->
        <div class="line-select-dropdown">
          <div
            class="line-select-trigger"
            :class="{ open: lineDropdownOpen }"
            @click.stop="toggleDropdown"
          >
            <span class="selected-line-name">
              {{ userLines[selectedLineIndex]?.name || '选择解析路径' }}
            </span>
            <el-icon :size="14" class="dropdown-arrow" :class="{ rotated: lineDropdownOpen }">
              <ArrowDown />
            </el-icon>
          </div>
          <!-- 下拉面板 -->
          <div v-show="lineDropdownOpen" class="line-select-options">
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
        </div>
        <!-- 管理入口 -->
        <button class="manage-lines-btn" @click="$emit('showLineManage')" title="管理解析路径">
          <el-icon :size="16"><Setting /></el-icon>
        </button>
        <button class="parse-btn" :disabled="!videoUrl.trim()" :class="{ loading: parsing || ytDlpExtracting }" @click="handleParse">
          <span>{{ parsing || ytDlpExtracting ? (useYtDlp ? '提取中' : '解析中') : '解析' }}</span>
        </button>
      </div>
    </div>

    <!-- 提取方式切换（第二行） -->
    <div class="parse-mode-switch" v-if="ytDlpAvailable">
      <span class="mode-label">提取方式：</span>
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: !useYtDlp }"
          :disabled="parsing || ytDlpExtracting"
          @click="useYtDlp = false"
        >第三方解析</button>
        <button
          class="mode-btn"
          :class="{ active: useYtDlp }"
          :disabled="parsing || ytDlpExtracting"
          @click="useYtDlp = true"
        >
          <span class="ytdlp-icon">⬇</span> yt-dlp 直链
        </button>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length" class="history-line">
      <span class="history-label">历史：</span>
      <span
        v-for="(item, idx) in history"
        :key="idx"
        class="history-item"
        :title="item.url"
        @click="replayFromHistory(item)"
      >{{ item.title || item.url }}</span>
      <button class="history-line-clear" @click="clearHistory">清空</button>
    </div>

    <!-- 使用指南 -->
    <div class="search-guide">
      <div class="guide-header">使用指南</div>
      <div class="guide-list">
        <div class="guide-item">
          <span class="guide-step">1、</span>
          <div class="guide-body">
            <span class="guide-title">粘贴链接</span>
            <span class="guide-desc">支持 腾讯视频、爱奇艺、优酷、芒果TV、B站 等主流平台的视频解析</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">2、</span>
          <div class="guide-body">
            <span class="guide-title">选择线路</span>
            <span class="guide-desc">选择合适的解析路径，点击立即解析即可观看</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">3、</span>
          <div class="guide-body">
            <span class="guide-title">管理接口</span>
            <span class="guide-desc">可点击设置按钮自行添加、修改或删除解析接口</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Link, CircleClose, Loading, ArrowDown, Setting, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  userLines: { type: Array, default: () => [] },
  apiHealthMap: { type: Object, default: () => ({}) },
  healthChecking: { type: Boolean, default: false },
  ytDlpAvailable: { type: Boolean, default: false },
  useYtDlp: { type: Boolean, default: false },
  parsing: { type: Boolean, default: false },
  ytDlpExtracting: { type: Boolean, default: false },
  selectedLineIndex: { type: Number, default: 0 }
})

const emit = defineEmits([
  'update:useYtDlp', 'update:selectedLineIndex',
  'parse', 'checkApiHealth', 'selectLine', 'showLineManage',
  'clearHistory', 'replayFromHistory'
])

const videoUrl = ref('')
const lineDropdownOpen = ref(false)

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

function getLineHealthStatus(lineName) {
  const h = props.apiHealthMap[lineName]
  if (!h || h.online === null) return 'unknown'
  return h.online ? 'online' : 'offline'
}

function toggleDropdown() {
  lineDropdownOpen.value = !lineDropdownOpen.value
}

function selectLine(idx) {
  emit('update:selectedLineIndex', idx)
  lineDropdownOpen.value = false
}

function checkApiHealth() {
  emit('checkApiHealth')
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
  emit('parse', { url, useYtDlp: props.useYtDlp })
  saveHistory({
    url,
    title: '视频',
    time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
}

function replayFromHistory(item) {
  videoUrl.value = item.url
  handleParse()
}

// 暴露给父组件
defineExpose({
  videoUrl,
  setUrl(url) { videoUrl.value = url }
})

// 点击外部关闭下拉
function handleClickOutside(e) {
  const target = e.target
  if (!target.closest('.line-select-dropdown')) {
    lineDropdownOpen.value = false
  }
}

import { onMounted, onBeforeUnmount } from 'vue'
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.parse-fused-wrap { position: relative; }
.parse-fused {
  display: flex;
  align-items: stretch;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.25s ease;
  margin-bottom: 12px;
  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
  }
}
.input-icon { color: #94a3b8; margin: 0 12px 0 16px; flex-shrink: 0; align-self: center; }
.url-input {
  flex: 1; border: none; outline: none; font-size: 16px; color: #0f172a; background: transparent; min-width: 0; padding: 14px 16px;
  &::placeholder { color: #94a3b8; }
}
.clear-icon { color: #94a3b8; cursor: pointer; flex-shrink: 0; align-self: center; margin-right: 12px; &:hover { color: #64748b; } }

// 融合搜索框分割线
.fused-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 10px 0;
  flex-shrink: 0;
}

// 线路选择（与 VIP 线路样式一致：无边框、文字加粗、hover 背景）
.line-select-dropdown { position: relative; display: flex; align-items: center; flex-shrink: 0; }
.line-select-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #475569;
  transition: background 0.2s;
  height: 100%;
  &:hover, &.open { background: #f8fafc; }
  &:hover .selected-line-name, &.open .selected-line-name { color: #6366f1; }
}
.selected-line-name { font-weight: 600; display: flex; align-items: center; gap: 6px; color: #475569; white-space: nowrap; transition: color 0.2s; }
.dropdown-arrow { color: #94a3b8; transition: transform 0.2s, color 0.2s; &.rotated { transform: rotate(180deg); } }

.line-select-options {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 260px;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  z-index: 200;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  animation: platformFadeIn 0.15s ease;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
}
@keyframes platformFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.line-option {
  padding: 9px 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-radius: 8px;
  &:hover { background: #eef2ff; }
  &:hover .line-option-name { color: #6366f1; }
  &.active { background: #eef2ff; .line-option-name { color: #6366f1; } }
}
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 8px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 4px;
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
.line-option-top { display: flex; align-items: center; gap: 6px; }
.line-option-name { font-size: 14px; font-weight: 500; color: #0f172a; transition: color 0.15s; }
.line-option-ping { font-size: 11px; color: #94a3b8; margin-left: auto; }
.line-option-api { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 14px; max-width: 260px; }

// 健康状态指示点
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: #cbd5e1;
  transition: all 0.3s;
  &.online { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
  &.offline { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }
  &.unknown { background: #cbd5e1; }
}

.manage-lines-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: #6366f1; background: #f8fafc; }
}

.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: all 0.2s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

// 解析模式切换
.parse-mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 16px 0 14px;
  flex-wrap: wrap;
}
.mode-label { font-size: 13px; color: #64748b; font-weight: 500; }
.mode-toggle { display: flex; background: #f1f5f9; border-radius: 10px; padding: 3px; }
.mode-btn {
  padding: 7px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover:not(:disabled) { color: #6366f1; }
  &.active { background: #fff; color: #6366f1; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
}
.ytdlp-icon { font-size: 11px; }

.parse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 0 12px 12px 0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
  transition: all 0.25s ease;
  &:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// 历史记录（与 VIP 视频历史样式一致）
.history-line {
  margin-top: 8px;
  padding-left: 4px;
  font-size: 12px;
  color: #333;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  animation: fadeIn 0.2s ease;
}
.history-label {
  color: #999;
  flex-shrink: 0;
}
.history-item {
  cursor: pointer;
  transition: color 0.15s;
  &::after { content: '、'; color: #ccc; }
  &:last-of-type::after { content: ''; }
  &:hover { color: #6366f1; }
}
.history-line-clear {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: #bbb;
  cursor: pointer;
  &:hover { color: #ef4444; }
}

// 使用指南（与 VIP 视频保持一致）
.search-guide {
  margin-top: 20px;
  margin-bottom: 28px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e8ecf4;
  border-radius: 12px;
}
.guide-header {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.guide-item {
  display: flex;
  align-items: center;
  gap: 2px;
}
.guide-step {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
}
.guide-body {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}
.guide-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  flex-shrink: 0;
}
.guide-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}

// 响应式
@media (max-width: 768px) {
  .parse-fused { border-radius: 12px; }
  .url-input { font-size: 15px; }
  .input-icon { margin-right: 8px; }
  .parse-btn { padding: 0 14px; font-size: 14px; }
  .line-select-trigger { padding: 0 12px; font-size: 13px; }
  .manage-lines-btn { width: 36px; }
  .parse-mode-switch { gap: 6px; }
  .mode-btn { padding: 5px 14px; font-size: 12px; }
  .history-section { padding: 14px; margin-bottom: 20px; }
  .history-header h3 { font-size: 14px; }
  .history-item { padding: 8px 10px; }
  .history-title { font-size: 13px; }
  .history-time { font-size: 11px; }
  .search-guide { padding: 14px; }
  .guide-header { font-size: 14px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 12px; }
}

@media (max-width: 480px) {
  .parse-fused { border-radius: 12px; }
  .url-input { font-size: 14px; &::placeholder { font-size: 12px; } }
  .input-icon { margin-right: 6px; }
  .parse-btn { padding: 0 12px; font-size: 13px; gap: 4px; }
  .line-select-trigger { font-size: 12px; padding: 0 10px; }
  .manage-lines-btn { width: 32px; }
  .fused-divider { margin: 8px 0; }
  .history-section { margin-bottom: 16px; padding: 12px; }
  .history-index { width: 22px; height: 22px; font-size: 11px; }
  .history-play { display: none; }
  .history-time { display: none; }
  .search-guide { padding: 12px; margin-top: 14px; margin-bottom: 20px; }
  .guide-header { font-size: 14px; margin-bottom: 12px; }
  .guide-list { gap: 8px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 11px; }
}

// 深色模式
:global(html.dark-mode .url-parse-panel) {
  .parse-fused {
    background: #1a1a2e; border-color: #2d2d4a;
    &:focus-within { border-color: #7c3aed; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12); }
  }
  .input-icon { color: #6b7280; }
  .url-input { color: #e2dee9; &::placeholder { color: #6b7280; } }
  .clear-icon { color: #6b7280; &:hover { color: #cbd5e1; } }
  .fused-divider { background: #2d2d4a; }
  .parse-mode-switch .mode-toggle { background: #1a1a2e; }
  .mode-label { color: #94a3b8; }
  .mode-btn { color: #6b7280; &.active { background: #252540; color: #a78bfa; } }
  .line-select-trigger {
    &:hover, &.open { background: #252540; }
    &:hover .selected-line-name, &.open .selected-line-name { color: #a78bfa; }
  }
  .selected-line-name { color: #94a3b8; }
  .dropdown-arrow { color: #6b7280; }
  .line-select-options { background: #1a1a2e; border-color: #2d2d4a; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
  .line-option { &:hover { background: #2d2d50; } &.active { background: #2d2d50; .line-option-name { color: #a78bfa; } } }
  .line-option-name { color: #e2dee9; }
  .line-option-ping, .line-option-api { color: #6b7280; }
  .dropdown-header { color: #6b7280; border-bottom-color: #2d2d4a; }
  .manage-lines-btn { color: #6b7280;
    &:hover { color: #a78bfa; background: #252540; }
  }
  .history-line { color: #94a3b8; }
  .history-label { color: #64748b; }
  .history-item {
    &:hover { color: #a78bfa; }
  }
  .history-line-clear {
    color: #64748b;
    &:hover { color: #f87171; }
  }
  .search-guide {
    background: #1a1a2e; border-color: #2d2d4a;
  }
  .guide-header { color: #e2dee9; }
  .guide-item { background: transparent; }
  .guide-step { color: #94a3b8; }
  .guide-title { color: #e2dee9; }
  .guide-desc { color: #6b7280; }
}
</style>

<template>
  <div class="url-parse-panel">
    <!-- 融合搜索框容器：输入框 + 线路选择 + 解析按钮 一行，下拉面板定位参照 -->
    <div class="parse-fused-wrap">
      <div class="parse-fused">
        <input
          v-model="videoUrl"
          class="url-parse-input"
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
        <button class="parse-btn" :disabled="!videoUrl.trim()" :class="{ loading: parsing }" @click="handleParse">
          <span>{{ parsing ? '解析中' : '解析' }}</span>
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

    <!-- 视频播放区（由父组件 slot 注入，放在历史下方） -->
    <slot name="player"></slot>

    <!-- 使用指南 -->
    <div class="search-guide" v-if="!parsing && !showPlayer">
      <div class="guide-header">使用指南</div>
      <div class="guide-list">
        <div class="guide-item">
          <span class="guide-step">1、</span>
          <div class="guide-body">
            <span class="guide-title">复制视频链接</span>
            <span class="guide-desc">从下方快捷跳转进入目标网站，复制需要解析的视频页面URL</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">2、</span>
          <div class="guide-body">
            <span class="guide-title">粘贴解析</span>
            <span class="guide-desc">粘贴链接到输入框，选择解析线路后点击解析，失败将自动切换下一条线路</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">3、</span>
          <div class="guide-body">
            <span class="guide-title">手动兜底</span>
            <span class="guide-desc">自动尝试全部失败后可手动点击线路按钮切换，仍无法播放请参考备用方案</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">4、</span>
          <div class="guide-body">
            <span class="guide-title">备用方案</span>
            <span class="guide-desc">如所有线路均无法播放，可点击下方快捷跳转进入目标网站直接观看</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷跳转 -->
    <div class="quick-jump-section">
      <div class="quick-jump-header">快捷跳转</div>
      <div class="quick-jump-grid">
        <a
          v-for="site in quickJumpSites"
          :key="site.name"
          :href="site.url"
          target="_blank"
          rel="noopener"
          class="quick-jump-card"
        >
          <span class="quick-jump-icon">{{ site.icon }}</span>
          <span class="quick-jump-name">{{ site.name }}</span>
        </a>
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
  parsing: { type: Boolean, default: false },
  selectedLineIndex: { type: Number, default: 0 },
  showPlayer: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:selectedLineIndex',
  'parse', 'checkApiHealth', 'selectLine', 'showLineManage',
  'clearHistory', 'replayFromHistory'
])

const videoUrl = ref('')
const lineDropdownOpen = ref(false)

// 快捷跳转平台
const quickJumpSites = [
  { name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: '📺' },
  { name: '腾讯视频', url: 'https://v.qq.com', icon: '🐧' },
  { name: '优酷', url: 'https://www.youku.com', icon: '▶' },
  { name: '芒果TV', url: 'https://www.mgtv.com', icon: '🥭' },
  { name: '爱奇艺', url: 'https://www.iqiyi.com', icon: '🥝' },
  { name: '搜狐视频', url: 'https://tv.sohu.com', icon: '🦊' }
]

const history = ref(loadHistory())

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_video_history') || '[]')
  } catch { return [] }
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
  // 链接解析统一走第三方解析；标题由父组件通过后端/dmku 自动获取
  emit('parse', { url, useYtDlp: false, title: '' })
  // 历史记录由父组件 index.vue 统一管理
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
  window.addEventListener('history-updated', reloadHistory)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('history-updated', reloadHistory)
})

// 从 localStorage 重新加载历史（响应 index.vue 的 updateHistoryTitle 调用）
function reloadHistory() {
  history.value = loadHistory()
}
</script>

<style lang="scss" scoped src="./UrlParse.scss"></style>

<style lang="scss">
html.dark-mode .url-parse-panel {
  .parse-fused { background: #1a1a2e; border-color: #2d2d4a; }
  .input-icon { color: #6b7280; }
  .url-parse-input { color: #e2dee9; }
  .clear-icon { color: #6b7280; &:hover { color: #cbd5e1; } }
  .fused-divider { background: #2d2d4a; }
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
  .quick-jump-section { background: #1a1a2e; border-color: #2d2d4a; }
  .quick-jump-header { color: #e2dee9; }
  .quick-jump-card {
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45); }
  }
  .search-guide { background: #1a1a2e; border-color: #2d2d4a; }
  .guide-header { color: #e2dee9; }
  .guide-item { background: transparent; }
  .guide-step { color: #94a3b8; }
  .guide-title { color: #e2dee9; }
  .guide-desc { color: #6b7280; }
}
</style>

<template>
  <div class="vip-video-parse-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">视频解析</h1>
        <p class="page-desc">搜索或粘贴链接，免费在线观看视频</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <!-- 输入模式切换 -->
      <div class="input-mode-switch">
        <button class="input-mode-btn" :class="{ active: inputMode === 'search' }" :disabled="searching" @click="switchInputMode('search')">
          <el-icon :size="14"><Search /></el-icon> 搜索视频
        </button>
        <button class="input-mode-btn" :class="{ active: inputMode === 'url' }" :disabled="searching" @click="switchInputMode('url')">
          <el-icon :size="14"><Link /></el-icon> 链接解析
        </button>
      </div>

      <!-- URL输入框 -->
      <div class="input-box" v-if="inputMode === 'url'">
        <el-icon class="input-icon" :size="20"><Link /></el-icon>
        <input
          v-model="videoUrl"
          class="url-input"
          placeholder="粘贴视频播放链接（支持腾讯、爱奇艺、优酷、芒果等）"
          @keydown.enter="handleParse"
        />
        <el-icon v-if="videoUrl" class="clear-icon" :size="18" @click="clearUrl">
          <CircleClose />
        </el-icon>
      </div>

      <!-- 名称搜索框 -->
      <div class="search-box" v-if="inputMode === 'search'">
        <!-- 不支持名称搜索的平台提示 -->
        <div v-if="isUnsupportedPlatform && !searching" class="platform-search-hint">
          <el-icon :size="16"><WarningFilled /></el-icon>
          <span>{{ { tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV' }[searchPlatform] }}暂不支持名称搜索，将在B站中搜索相关视频</span>
          <span class="hint-action" @click="switchInputMode('url')">如需观看该平台独播剧集，请切换到「链接解析」模式</span>
        </div>
        <div class="search-row">
          <el-icon class="input-icon" :size="20"><Search /></el-icon>
          <input
            v-model="searchQuery"
            class="url-input"
            placeholder="输入视频名称搜索（如：周杰伦 稻香 MV）"
            :disabled="searching"
            @keydown.enter="handleSearch"
          />
          <el-icon v-if="searchQuery && !searching" class="clear-icon" :size="18" @click="searchQuery = ''">
            <CircleClose />
          </el-icon>
          <select v-model="searchPlatform" class="platform-select" :disabled="searching">
            <option value="bilibili">B站</option>
            <option value="youtube">YouTube</option>
            <option value="bilibili_youtube">B站 + YouTube</option>
            <option value="tencent">腾讯视频</option>
            <option value="youku">优酷</option>
            <option value="iqiyi">爱奇艺</option>
            <option value="mgtv">芒果TV</option>
          </select>
          <button class="search-btn" :disabled="!searchQuery.trim() || searching" @click="handleSearch">
            <el-icon v-if="!searching" :size="16"><Search /></el-icon>
            <el-icon v-else class="is-loading" :size="16"><Loading /></el-icon>
          </button>
        </div>
      </div>

      <!-- 搜索加载遮罩层 -->
      <div v-if="searching" class="search-loading-overlay">
        <div class="search-loading-card">
          <div class="search-loading-icon">
            <el-icon class="is-loading" :size="48"><Loading /></el-icon>
          </div>
          <h3 class="search-loading-title">正在搜索中...</h3>
          <p class="search-loading-query">"{{ searchQuery }}"</p>
          <p class="search-loading-platform">
            搜索范围：{{ { auto: 'B站 + YouTube', bilibili: 'B站', youtube: 'YouTube', tencent: 'B站 + YouTube', youku: 'B站 + YouTube', iqiyi: 'B站 + YouTube', mgtv: 'B站 + YouTube' }[searchPlatform] || 'B站 + YouTube' }}
          </p>
          <div class="search-loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.min(searchElapsed / 60 * 100, 95) + '%' }"></div>
            </div>
            <span class="progress-text">已等待 {{ searchElapsed }} 秒{{ searchElapsed > 30 ? '，yt-dlp 搜索较慢请耐心等待' : '' }}{{ searchElapsed > 55 ? '，即将完成...' : '' }}</span>
          </div>
          <p class="search-loading-hint">搜索过程中请勿刷新页面或切换模式</p>
        </div>
      </div>

      <!-- 解析路径选择（仅链接解析模式显示） -->
      <div class="parse-line-select" v-if="inputMode === 'url' && userLines.length > 0">
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

      <div class="input-actions" v-if="inputMode === 'url'">
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
        <button class="parse-btn" :disabled="!videoUrl.trim()" :class="{ loading: parsing || ytDlpExtracting }" @click="handleParse">
          <el-icon v-if="!parsing && !ytDlpExtracting" :size="18"><VideoPlay /></el-icon>
          <el-icon v-else class="is-loading" :size="18"><Loading /></el-icon>
          <span>{{ parsing || ytDlpExtracting ? (useYtDlp ? '提取中...' : '解析中...') : '立即解析' }}</span>
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
          <!-- yt-dlp 提取信息 -->
          <span v-if="ytDlpVideoInfo" class="ytdlp-info">
            <span class="ytdlp-badge">yt-dlp</span>
            <span v-if="ytDlpVideoInfo.durationString" class="ytdlp-duration">{{ ytDlpVideoInfo.durationString }}</span>
          </span>
          <!-- 第三方解析线路切换 -->
          <div class="line-switcher" v-if="!useYtDlp && userLines.length > 1">
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

        <!-- yt-dlp 直链播放器 -->
        <div v-if="useYtDlp && ytDlpStreamUrl" class="video-wrapper">
          <video
            ref="videoPlayer"
            class="video-player-native"
            controls
            autoplay
            playsinline
          ></video>
        </div>

        <!-- yt-dlp 提取中 -->
        <div v-else-if="useYtDlp && ytDlpExtracting" class="video-wrapper">
          <div class="video-placeholder extracting">
            <el-icon class="is-loading" :size="48"><Loading /></el-icon>
            <p>yt-dlp 正在提取视频流...</p>
            <span class="extract-hint">{{ ytDlpExtractHint }}</span>
          </div>
        </div>

        <!-- yt-dlp 提取失败 -->
        <div v-else-if="useYtDlp && ytDlpError" class="video-wrapper">
          <div class="video-placeholder error">
            <el-icon :size="48"><WarningFilled /></el-icon>
            <p>提取失败</p>
            <span class="error-detail">{{ ytDlpError }}</span>
            <button class="fallback-btn" @click="switchToThirdParty">切换到第三方解析</button>
          </div>
        </div>

        <!-- 第三方解析 iframe 播放 -->
        <div v-else-if="!useYtDlp" class="video-wrapper">
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

    <!-- 搜索结果 -->
    <div v-if="(searchGroups.length > 0 || searchUngrouped.length > 0) && inputMode === 'search'" class="search-results-section">
      <div class="search-results-header">
        <h3>
          🔍 搜索结果
          <span class="result-count">
            ({{ searchGroups.length }} 部剧目{{ searchGroups.length > 0 ? '，共 ' + totalEpisodes + ' 集' : '' }}{{ searchUngrouped.length > 0 ? ' + ' + searchUngrouped.length + ' 个独立视频' : '' }})
          </span>
        </h3>
        <span class="search-platform-badge">{{ {
          auto: '自动', bilibili: 'B站', youtube: 'YouTube',
          tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV'
        }[searchPlatform] || '自动' }}</span>
      </div>

      <!-- 剧集分组卡片 -->
      <div class="show-groups-list">
        <div
          v-for="(group, gi) in searchGroups"
          :key="'g-' + gi"
          class="show-group-card"
          :class="{ expanded: expandedGroups.has(gi) }"
        >
          <!-- 剧目头部 -->
          <div class="show-group-header" @click="toggleGroup(gi)">
            <div class="show-group-thumb">
              <img
                v-if="group.thumbnail"
                :src="group.thumbnail"
                referrerpolicy="no-referrer"
                loading="lazy"
                class="show-group-thumb-img"
                alt=""
              />
              <span v-else class="show-group-thumb-placeholder">📺</span>
            </div>
            <div class="show-group-info">
              <p class="show-group-name">{{ group.showName }}</p>
              <p class="show-group-meta">
                <span class="show-ep-count">{{ group.episodeCount }} 集</span>
                <span v-if="group.uploader" class="show-uploader">· {{ group.uploader }}</span>
                <span v-if="groupPlaylists[gi]" class="show-full-tag">· 已加载全部 {{ groupPlaylists[gi].length }} 集</span>
              </p>
            </div>
            <div class="show-group-actions">
              <button
                v-if="group.uploaderUrl"
                class="fetch-playlist-btn"
                :class="{ loading: loadingPlaylists.has(gi) }"
                :disabled="loadingPlaylists.has(gi)"
                @click.stop="fetchFullPlaylist(gi, group)"
                :title="'获取该UP主全部' + group.showName + '剧集'"
              >
                <el-icon v-if="loadingPlaylists.has(gi)" class="is-loading" :size="14"><Loading /></el-icon>
                <span v-else>获取全部剧集</span>
              </button>
              <el-icon class="expand-icon" :class="{ rotated: expandedGroups.has(gi) }" :size="20">
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <!-- 剧集列表（展开后显示） -->
          <transition name="episode-expand">
            <div v-if="expandedGroups.has(gi)" class="show-episodes-panel">
              <div class="episodes-grid">
                <div
                  v-for="ep in (groupPlaylists[gi] || group.episodes)"
                  :key="ep.id"
                  class="episode-card"
                  :class="{ playing: playingEpisodeId === ep.id }"
                  @click="playEpisode(ep)"
                >
                  <div class="ep-thumb">
                    <img
                      v-if="ep.thumbnail"
                      :src="ep.thumbnail"
                      referrerpolicy="no-referrer"
                      loading="lazy"
                      class="ep-thumb-img"
                      alt=""
                    />
                    <span v-else class="ep-thumb-placeholder">🎬</span>
                    <span v-if="ep.durationString" class="ep-duration">{{ ep.durationString }}</span>
                    <div v-if="playingEpisodeId === ep.id" class="ep-playing-overlay">
                      <el-icon :size="28"><VideoPlay /></el-icon>
                      <span>播放中</span>
                    </div>
                  </div>
                  <div class="ep-info">
                    <p class="ep-title" :title="ep.title">{{ ep.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 独立视频（非剧集） -->
      <div v-if="searchUngrouped.length > 0" class="ungrouped-section">
        <h4 class="ungrouped-title">🎬 独立视频</h4>
        <div class="search-results-grid">
          <div
            v-for="item in searchUngrouped"
            :key="item.id"
            class="search-result-card"
            @click="playEpisode(item)"
          >
            <div class="card-thumb">
              <img
                v-if="item.thumbnail"
                :src="item.thumbnail"
                referrerpolicy="no-referrer"
                loading="lazy"
                class="card-thumb-img"
                alt=""
              />
              <span v-else class="card-thumb-placeholder">🎬</span>
              <span v-if="item.durationString" class="card-duration">{{ item.durationString }}</span>
            </div>
            <div class="card-info">
              <p class="card-title" :title="item.title">{{ item.title }}</p>
              <p class="card-uploader" v-if="item.uploader">{{ item.uploader }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div v-if="searchNoResult" class="search-no-result">
      <p>未找到相关视频，请换个关键词试试</p>
    </div>

    <!-- 搜索历史 -->
    <div v-if="searchHistory.length && inputMode === 'search'" class="history-section">
      <div class="history-header">
        <h3>📋 搜索记录</h3>
        <el-button text size="small" type="danger" @click="clearSearchHistory">清空</el-button>
      </div>
      <div class="history-list">
        <div v-for="(kw, idx) in searchHistory" :key="idx" class="history-item" @click="quickSearch(kw)">
          <span class="history-index">{{ idx + 1 }}</span>
          <span class="history-title">{{ kw }}</span>
          <el-icon class="history-play" :size="14"><Search /></el-icon>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div v-if="history.length && inputMode === 'url'" class="history-section">
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
      <ul class="tips-list" v-if="inputMode === 'search'">
        <li>输入关键词即可搜索全网视频，支持中文、英文和拼音</li>
        <li>支持 <strong>B站、腾讯视频、优酷、爱奇艺、芒果TV、YouTube</strong> 等平台</li>
        <li>可通过下拉菜单指定平台筛选，默认<span class="tip-tag">自动</span>匹配</li>
        <li>点击搜索结果卡片即可直接播放，无需手动输入链接</li>
        <li>搜索结果由 yt-dlp 引擎提供，仅供学习交流使用</li>
      </ul>
      <ul class="tips-list" v-else>
        <li>支持 <strong>腾讯视频、爱奇艺、优酷、芒果TV、B站</strong> 等主流平台的视频解析</li>
        <li>输入视频链接，选择合适的解析路径，点击<span class="tip-tag">立即解析</span>即可观看</li>
        <li>可点击设置按钮自行添加、修改或删除解析接口</li>
        <li>遇到无法播放时，请尝试<span class="tip-tag">切换线路</span>或<span class="tip-tag">刷新检测</span></li>
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeft, Link, CircleClose, VideoPlay, Loading, VideoCamera,
  ArrowDown, Setting, Plus, Refresh, WarningFilled, Search
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Hls from 'hls.js'

// ==================== 输入状态 ====================
const videoUrl = ref('')
const parsing = ref(false)
const showPlayer = ref(false)
const parsedTitle = ref('')

// 输入模式：url（链接解析）| search（名称搜索）
const inputMode = ref('search')

// ==================== 搜索状态 ====================
const searchQuery = ref('')
const searchPlatform = ref('bilibili')
const searching = ref(false)
const searchElapsed = ref(0)            // 搜索已用秒数
let searchTimer = null                  // 计时器
const searchResults = ref([])          // 原始全量结果（兼容）
const searchGroups = ref([])           // 分组：剧目列表
const searchUngrouped = ref([])        // 未分组：独立视频
const searchNoResult = ref(false)
const searchHistory = ref(loadSearchHistory())

// 剧集分组相关状态
const expandedGroups = ref(new Set())  // 当前展开的分组索引
const groupPlaylists = ref({})         // { [groupIndex]: episodes[] } 完整剧集列表
const loadingPlaylists = ref(new Set()) // 正在加载完整剧集的分组
const playingEpisodeId = ref('')       // 当前播放中的剧集ID

// 所有剧集总数
const totalEpisodes = computed(() => {
  return searchGroups.value.reduce((sum, g) => sum + g.episodeCount, 0)
})

// 不支持名称搜索的平台（yt-dlp 只有 bilisearch 和 ytsearch）
const unsupportedPlatforms = new Set(['tencent', 'youku', 'iqiyi', 'mgtv'])
const isUnsupportedPlatform = computed(() => unsupportedPlatforms.has(searchPlatform.value))

function toggleGroup(gi) {
  const newSet = new Set(expandedGroups.value)
  if (newSet.has(gi)) {
    newSet.delete(gi)
  } else {
    newSet.add(gi)
  }
  expandedGroups.value = newSet
}

// 从UP主空间/合集页获取全部剧集
async function fetchFullPlaylist(gi, group) {
  if (!group.uploaderUrl) return
  if (loadingPlaylists.value.has(gi)) return

  const loadingSet = new Set(loadingPlaylists.value)
  loadingSet.add(gi)
  loadingPlaylists.value = loadingSet

  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: group.uploaderUrl, limit: 100 })
    })
    const data = await res.json()
    if (data?.code === 0 && data.data?.videos?.length > 0) {
      // 过滤：只保留标题与剧目相关的视频
      const keyword = group.showName.replace(/\s+/g, '')
      const filtered = data.data.videos.filter(v =>
        v.title && (
          v.title.includes(group.showName) ||
          v.title.includes(keyword) ||
          // 没有关键词匹配但属于同一合集
          v.playlistIndex > 0
        )
      )
      const newPlaylists = { ...groupPlaylists.value }
      newPlaylists[gi] = filtered.length > 0 ? filtered : data.data.videos
      groupPlaylists.value = newPlaylists

      // 自动展开
      if (filtered.length > 0) {
        const newSet = new Set(expandedGroups.value)
        newSet.add(gi)
        expandedGroups.value = newSet
      }
      ElMessage.success(`已获取 ${filtered.length || data.data.videos.length} 集`)
    } else {
      ElMessage.warning('未能获取到更多剧集')
    }
  } catch (err) {
    console.error('获取剧集列表失败:', err)
    ElMessage.error('获取剧集列表失败')
  } finally {
    const loadingSet = new Set(loadingPlaylists.value)
    loadingSet.delete(gi)
    loadingPlaylists.value = loadingSet
  }
}

// 播放指定剧集
function playEpisode(ep) {
  playingEpisodeId.value = ep.id
  videoUrl.value = ep.webpageUrl || `https://www.bilibili.com/video/${ep.id}`
  showPlayer.value = true
  parsedTitle.value = ep.title || '视频'
  useYtDlp.value = true
  inputMode.value = 'url'

  // 直接用 yt-dlp 提取并播放
  handleYtDlpExtract(videoUrl.value.trim())
}

function switchInputMode(mode) {
  inputMode.value = mode
  searchResults.value = []
  searchGroups.value = []
  searchUngrouped.value = []
  searchNoResult.value = false
  expandedGroups.value = new Set()
  groupPlaylists.value = {}
  playingEpisodeId.value = ''
}

function loadSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_video_search_history') || '[]')
  } catch { return [] }
}

function saveSearchHistory(kw) {
  const list = [kw, ...searchHistory.value.filter(k => k !== kw)].slice(0, 20)
  searchHistory.value = list
  try {
    localStorage.setItem('vip_video_search_history', JSON.stringify(list))
  } catch { /* ignore */ }
}

function clearSearchHistory() {
  searchHistory.value = []
  try { localStorage.removeItem('vip_video_search_history') } catch { /* ignore */ }
  ElMessage.success('搜索记录已清空')
}

function quickSearch(kw) {
  searchQuery.value = kw
  handleSearch()
}

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    ElMessage.warning('请输入视频名称')
    return
  }
  if (!ytDlpAvailable.value) {
    ElMessage.warning('名称搜索需要服务器安装 yt-dlp')
    return
  }

  // 不支持名称搜索的平台，给出提示但仍然搜索
  if (isUnsupportedPlatform.value) {
    const platformNames = {
      tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV'
    }
    ElMessage.warning(`${platformNames[searchPlatform.value]}暂不支持名称搜索，将在B站中搜索相关视频`)
  }

  searching.value = true
  searchElapsed.value = 0
  // 启动计时器
  searchTimer = setInterval(() => {
    searchElapsed.value++
  }, 1000)
  searchResults.value = []
  searchGroups.value = []
  searchUngrouped.value = []
  searchNoResult.value = false
  expandedGroups.value = new Set()
  groupPlaylists.value = {}
  loadingPlaylists.value = new Set()
  playingEpisodeId.value = ''

  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        platform: searchPlatform.value,
        limit: 10
      })
    })
    const data = await res.json()
    if (data?.code === 0 && data.data) {
      searchResults.value = data.data.results || []
      searchGroups.value = data.data.groups || []
      searchUngrouped.value = data.data.ungrouped || []

      if (searchGroups.value.length === 0 && searchUngrouped.value.length === 0) {
        searchNoResult.value = true
      } else {
        saveSearchHistory(q)
      }
    } else {
      searchNoResult.value = true
    }
  } catch (err) {
    console.error('搜索失败:', err)
    ElMessage.error('搜索失败，请检查网络或稍后重试')
  } finally {
    clearInterval(searchTimer)
    searchTimer = null
    searching.value = false
  }
}

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
  let timeoutId = null
  try {
    const controller = new AbortController()
    // 后端需要逐一检测8条第三方解析线路，预留充足的超时时间
    timeoutId = setTimeout(() => controller.abort(), 20000)
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
    if (err.name === 'AbortError') {
      // 超时取消，静默处理
      console.debug('健康检测超时，已取消（线路检测耗时较长）')
    } else {
      console.warn('健康检测失败（后端未启动）:', err.message)
    }
    const map = {}
    userLines.value.forEach(l => { map[l.name] = { online: null, responseTime: null } })
    apiHealthMap.value = map
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    healthChecking.value = false
    healthChecked.value = true
  }
}

function getLineHealthStatus(lineName) {
  const h = apiHealthMap.value[lineName]
  if (!h || h.online === null) return 'unknown'
  return h.online ? 'online' : 'offline'
}

// ==================== yt-dlp 模式 ====================
const ytDlpAvailable = ref(false)
const ytDlpVersion = ref('')
const useYtDlp = ref(false)                // 当前是否使用 yt-dlp 模式
const ytDlpExtracting = ref(false)
const ytDlpStreamUrl = ref('')
const ytDlpStreamType = ref('')     // 'm3u8' | 'mp4' | 'direct'
const ytDlpVideoInfo = ref(null)
const ytDlpError = ref('')
const ytDlpExtractHint = ref('')
const videoPlayer = ref(null)

async function checkYtDlpStatus() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('/staticTool/api/video-parse/ytdlp/status', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const data = await res.json()
    if (data?.code === 0 && data.data?.available) {
      ytDlpAvailable.value = true
      ytDlpVersion.value = data.data.version || ''
      // 默认使用 yt-dlp 提取
      useYtDlp.value = true
    }
  } catch {
    // yt-dlp 不可用，默认使用第三方解析
    ytDlpAvailable.value = false
    useYtDlp.value = false
  }
}

async function handleYtDlpExtract(url) {
  ytDlpExtracting.value = true
  ytDlpError.value = ''
  ytDlpStreamUrl.value = ''
  ytDlpStreamType.value = ''
  ytDlpVideoInfo.value = null

  // 阶段1：提取视频信息（标题、格式等）
  ytDlpExtractHint.value = '正在获取视频信息...'
  try {
    const infoRes = await fetch('/staticTool/api/video-parse/ytdlp/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const infoData = await infoRes.json()
    if (infoData?.code !== 0) {
      ytDlpError.value = infoData?.message || '提取失败'
      ytDlpExtracting.value = false
      return
    }
    ytDlpVideoInfo.value = infoData.data
    parsedTitle.value = infoData.data.title || '视频'
  } catch (err) {
    ytDlpError.value = '服务器连接失败，请检查后端是否启动'
    ytDlpExtracting.value = false
    return
  }

  // 阶段2：获取直接流地址
  ytDlpExtractHint.value = '正在提取视频流地址...'
  try {
    const streamRes = await fetch('/staticTool/api/video-parse/ytdlp/stream-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const streamData = await streamRes.json()
    if (streamData?.code !== 0) {
      ytDlpError.value = streamData?.message || '获取流地址失败'
      ytDlpExtracting.value = false
      return
    }
    ytDlpStreamUrl.value = streamData.data.url
    ytDlpStreamType.value = streamData.data.type || ''
    ytDlpExtracting.value = false
    ElMessage.success('提取成功！开始播放')

    // 保存历史
    saveHistory({
      url,
      title: parsedTitle.value,
      time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
  } catch (err) {
    ytDlpError.value = '获取流地址失败'
    ytDlpExtracting.value = false
  }
}

function switchToThirdParty() {
  useYtDlp.value = false
  ytDlpError.value = ''
  ytDlpStreamUrl.value = ''
  ytDlpVideoInfo.value = null
  ytDlpExtracting.value = false
  // 自动用第三方解析
  handleThirdPartyParse(videoUrl.value.trim())
}

function handleThirdPartyParse(url) {
  parsing.value = true
  currentLine.value = selectedLineIndex.value
  showPlayer.value = true

  setTimeout(() => {
    const titleMatch = url.match(/title=([^&]+)/)
    parsedTitle.value = titleMatch ? decodeURIComponent(titleMatch[1]) : '视频'
    parsing.value = false

    saveHistory({
      url,
      title: parsedTitle.value,
      time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    ElMessage.success('解析成功！开始播放')
  }, 800)
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

  showPlayer.value = true

  if (useYtDlp.value && ytDlpAvailable.value) {
    // yt-dlp 模式
    if (ytDlpExtracting.value) return
    handleYtDlpExtract(url)
  } else {
    // 第三方解析模式
    if (userLines.value.length === 0) {
      ElMessage.warning('请先添加解析路径')
      return
    }
    useYtDlp.value = false
    handleThirdPartyParse(url)
  }
}

function replayFromHistory(item) {
  videoUrl.value = item.url
  handleParse()
}

// ==================== 计算属性 ====================
// 从用户自定义路径中解析，优先使用当前切换的线路（仅第三方解析模式使用）
const currentPlayUrl = computed(() => {
  if (!showPlayer.value || useYtDlp.value) return ''
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

// ==================== hls.js 播放器 ====================
let hls = null

watch(ytDlpStreamUrl, async (url) => {
  if (!url) return

  // 销毁旧实例
  if (hls) {
    hls.destroy()
    hls = null
  }

  await nextTick()
  const video = videoPlayer.value
  if (!video) return

  // 流类型来自后端响应，代理 URL 不再包含 .m3u8 后缀
  const isM3u8 = ytDlpStreamType.value === 'm3u8' ||
    url.includes('.m3u8') || url.includes('/m3u8') || /m3u8/i.test(url)

  const isProxyUrl = url.includes('/proxy-stream/')

  if (isM3u8 && Hls.isSupported()) {
    hls = new Hls({
      xhrSetup: (xhr) => {
        // 非代理模式需要手动设置 Referer；代理模式下后端已处理
        if (!isProxyUrl) {
          xhr.setRequestHeader('Referer', 'https://www.bilibili.com/')
        }
      }
    })
    hls.loadSource(url)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {})
    })
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('[hls.js fatal]', data.type, data.details)
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            ElMessage.error('网络错误，视频加载失败')
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            // 尝试恢复
            hls.recoverMediaError()
            break
          default:
            hls.destroy()
            break
        }
      }
    })
  } else if (isM3u8 && video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari 原生支持 HLS
    video.src = url
  } else {
    // 普通 mp4 或其他格式
    video.src = url
  }
})

// 注册/移除全局点击事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  checkApiHealth()
  checkYtDlpStatus()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (searchTimer) {
    clearInterval(searchTimer)
    searchTimer = null
  }
})
</script>

<style lang="scss" scoped>
.vip-video-parse-page {
  padding: 40px 24px;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.back-btn { flex-shrink: 0; }
.header-center { flex: 1; text-align: center; }
.header-spacer { flex-shrink: 0; width: 60px; }

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-desc { font-size: 15px; color: #64748b; }

// Input section
.input-section { margin-bottom: 36px; }

// 输入模式切换
.input-mode-switch {
  display: inline-flex;
  gap: 0;
  margin-bottom: 14px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}
.input-mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 20px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover { color: #6366f1; }
  &.active {
    background: #fff;
    color: #6366f1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
}

.input-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e8ecf1;
  border-radius: 16px;
  padding: 0 16px;
  height: 56px;
  transition: all 0.3s ease;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 4px 24px rgba(99,102,241,0.12), 0 1px 3px rgba(0,0,0,0.03);
  }
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
  padding: 4px 0 0;
  margin-bottom: 10px;
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
  padding: 9px 14px;
  background: #f8fafc;
  border: 1px solid #e8ecf1;
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
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
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
  transition: all 0.3s;
  &.online { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
  &.offline { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }
  &.unknown { background: #cbd5e1; }
}

.manage-lines-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid #e8ecf1;
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

.input-actions { margin-top: 16px; }

// 解析模式切换
.parse-mode-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.mode-label { font-size: 13px; color: #64748b; font-weight: 500; }
.mode-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
}
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
  &.active {
    background: #fff;
    color: #6366f1;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
}
.ytdlp-icon { font-size: 11px; }

.parse-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 44px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.4); }
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
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--pf-color);
  background: color-mix(in srgb, var(--pf-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--pf-color) 25%, transparent);
  transition: all 0.2s;
  &:hover {
    background: color-mix(in srgb, var(--pf-color) 15%, transparent);
  }
}

// Player
.player-section { margin-bottom: 44px; }

.player-container {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 12px;
}
.player-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.ytdlp-info { display: flex; align-items: center; gap: 8px; }
.ytdlp-badge {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #fef3c7;
  color: #d97706;
}
.ytdlp-duration { font-size: 12px; color: #94a3b8; }
.line-switcher { display: flex; align-items: center; gap: 6px; }
.line-label { font-size: 12px; color: #94a3b8; }
.line-btn {
  padding: 4px 12px;
  border: 1px solid #e8ecf1;
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
  background: #0f172a;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

// 原生 video 播放器（yt-dlp 直链）
.video-player-native {
  width: 100%;
  height: 100%;
  outline: none;
}

// yt-dlp 提取中/失败状态
.video-placeholder.extracting, .video-placeholder.error {
  .extract-hint { font-size: 13px; color: #94a3b8; }
  .error-detail { font-size: 13px; color: #ef4444; max-width: 80%; text-align: center; word-break: break-all; }
}
.fallback-btn {
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
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

// 搜索框
.search-box { margin-bottom: 0; }
.search-row {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e8ecf1;
  border-radius: 16px;
  padding: 0 12px 0 16px;
  height: 56px;
  transition: all 0.3s ease;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 4px 24px rgba(99,102,241,0.12), 0 1px 3px rgba(0,0,0,0.03);
  }
}
.platform-select {
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 13px;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.2s;
  &:focus { border-color: #6366f1; }
}
.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
  &:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 4px 16px rgba(99,102,241,0.35); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// 不支持名称搜索的平台提示
.platform-search-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 13px;
  color: #92400e;
  .hint-action {
    color: #6366f1;
    font-weight: 500;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

// 搜索加载遮罩层
.search-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}
.search-loading-card {
  background: #fff;
  border-radius: 20px;
  padding: 44px 48px;
  max-width: 440px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  animation: scaleIn 0.3s ease-out;
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.search-loading-icon {
  margin-bottom: 16px;
  color: #6366f1;
}
.search-loading-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}
.search-loading-query {
  font-size: 15px;
  color: #6366f1;
  font-weight: 600;
  margin: 0 0 4px;
  word-break: break-all;
}
.search-loading-platform {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 24px;
}
.search-loading-progress {
  margin-bottom: 16px;
  .progress-bar {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 3px;
    transition: width 0.5s ease;
    min-width: 2%;
  }
  .progress-text {
    font-size: 12px;
    color: #94a3b8;
  }
}
.search-loading-hint {
  font-size: 12px;
  color: #cbd5e1;
  margin: 0;
}

// 搜索中禁用状态
.input-mode-btn:disabled,
.platform-select:disabled,
.url-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

// 搜索结果
.search-results-section { margin-bottom: 44px; }
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }
  .result-count { font-size: 13px; color: #94a3b8; font-weight: 400; }
}
.search-platform-badge {
  padding: 3px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f0ff;
  color: #6366f1;
}

// ============= 剧集分组卡片 =============
.show-groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.show-group-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  &:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 20px rgba(99,102,241,0.1);
  }
  &.expanded {
    border-color: #6366f1;
    box-shadow: 0 6px 28px rgba(99,102,241,0.12);
  }
}

.show-group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #fafbfd; }
}

.show-group-thumb {
  width: 120px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  background: #1e293b;
  flex-shrink: 0;
  position: relative;
}
.show-group-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.show-group-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 28px;
  opacity: 0.5;
}

.show-group-info {
  flex: 1;
  min-width: 0;
}
.show-group-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.show-group-meta {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.show-ep-count {
  color: #6366f1;
  font-weight: 600;
}
.show-uploader { color: #94a3b8; }
.show-full-tag { color: #22c55e; font-weight: 500; }

.show-group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.fetch-playlist-btn {
  padding: 6px 14px;
  border: 1px solid #6366f1;
  background: transparent;
  color: #6366f1;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover:not(:disabled) { background: #6366f1; color: #fff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &.loading { background: #6366f1; color: #fff; opacity: 0.7; }
}

.expand-icon {
  color: #94a3b8;
  transition: transform 0.3s ease;
  &.rotated { transform: rotate(180deg); }
}

// 剧集展开面板
.show-episodes-panel {
  border-top: 1px solid #f1f5f9;
  background: #fafbfd;
  padding: 16px 20px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.episode-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover {
    border-color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(99,102,241,0.15);
  }
  &.playing {
    border-color: #22c55e;
    box-shadow: 0 0 0 2px rgba(34,197,94,0.3);
  }
}

.ep-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1e293b;
  position: relative;
  overflow: hidden;
}
.ep-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ep-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
  opacity: 0.4;
}
.ep-duration {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(0,0,0,0.75);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
}
.ep-playing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(34,197,94,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.ep-info { padding: 8px 10px; }
.ep-title {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

// 展开动画
.episode-expand-enter-active,
.episode-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.episode-expand-enter-from,
.episode-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.episode-expand-enter-to,
.episode-expand-leave-from {
  max-height: 2000px;
}

// ============= 独立视频区域 =============
.ungrouped-section {
  margin-top: 24px;
}
.ungrouped-title {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 12px;
}

.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.search-result-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  &:hover {
    border-color: #6366f1;
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(99,102,241,0.15);
  }
}
.card-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.card-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.card-thumb-placeholder { font-size: 40px; opacity: 0.4; }
.card-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.card-info { padding: 12px 14px; }
.card-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}
.card-uploader {
  font-size: 11px;
  color: #94a3b8;
  margin: 5px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-no-result {
  text-align: center;
  padding: 48px 20px;
  p { font-size: 14px; color: #94a3b8; }
}

// History
.history-section { margin-bottom: 44px; }
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
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  &:hover { background: #f0f0ff; border-color: #e0e0ff; }
}
.history-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e8ecf1;
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
  background: linear-gradient(135deg, #f8fafc, #f0f0ff);
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  padding: 28px;
  h3 { font-size: 17px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; }
}
.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  li {
    font-size: 14px;
    color: #555;
    line-height: 1.7;
    strong { color: #0f172a; }
    .tip-tag {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 4px;
      background: #eef0ff;
      color: #6366f1;
      font-size: 12px;
      font-weight: 500;
    }
  }
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
    border: 1px solid #e8ecf1;
    border-radius: 12px;
  }
  .add-inputs { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .add-input {
    padding: 8px 12px;
    border: 1px solid #e8ecf1;
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
    padding: 9px 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
    border: 1px solid #e8ecf1;
    border-radius: 12px;
    overflow: hidden;
  }
  .line-manage-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e8ecf1;
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
      border: 1px solid #e8ecf1;
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
  .page-header { margin-bottom: 20px; padding-bottom: 16px; flex-wrap: wrap; }
  .header-spacer { display: none; }
  .back-btn { padding: 4px; }
  .page-title { font-size: 24px; }
  .page-desc { font-size: 14px; }

  .input-box { height: 48px; border-radius: 13px; padding: 0 12px; }
  .url-input { font-size: 14px; &::placeholder { font-size: 13px; } }
  .input-icon { margin-right: 8px; }
  .parse-btn { padding: 12px 32px; font-size: 15px; border-radius: 12px; }
  .platform-tags { gap: 6px; }
  .platform-label { font-size: 12px; }
  .platform-chip { font-size: 11px; padding: 3px 10px; }

  .player-container { border-radius: 13px; }
  .player-header { flex-direction: column; align-items: flex-start; padding: 12px 14px; gap: 8px; }
  .player-title { font-size: 14px; }
  .line-switcher { flex-wrap: wrap; }

  .history-header h3 { font-size: 16px; }
  .history-item { padding: 8px 10px; }
  .history-title { font-size: 13px; }
  .history-time { font-size: 11px; }

  .tips-section { padding: 20px; border-radius: 14px; }
  .tips-section h3 { font-size: 15px; }
  .tips-list li { font-size: 13px; }

  .line-select-label { font-size: 12px; }
  .line-select-trigger { padding: 6px 10px; border-radius: 8px; font-size: 13px; }
  .manage-lines-btn { width: 34px; height: 34px; border-radius: 8px; }

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

  .parse-mode-switch { gap: 6px; }
  .mode-btn { padding: 5px 14px; font-size: 12px; }

  .input-mode-switch { border-radius: 10px; }
  .input-mode-btn { padding: 6px 14px; font-size: 12px; }

  .search-row { height: 48px; border-radius: 13px; padding: 0 10px 0 12px; gap: 4px; }
  .platform-select { padding: 4px 8px; font-size: 12px; }
  .search-btn { width: 36px; height: 36px; }

  // 剧集分组平板适配
  .show-group-header { padding: 12px 14px; gap: 12px; }
  .show-group-thumb { width: 100px; height: 56px; }
  .show-group-name { font-size: 14px; }
  .show-group-meta { font-size: 12px; }
  .fetch-playlist-btn { padding: 4px 10px; font-size: 11px; }
  .show-episodes-panel { padding: 12px 14px; }
  .episodes-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }

  .search-results-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .card-title { font-size: 12px; }
}

// Responsive - 手机
@media (max-width: 480px) {
  .vip-video-parse-page { padding: 16px 12px; }
  .page-header { margin-bottom: 16px; padding-bottom: 12px; }
  .page-title { font-size: 22px; }
  .page-desc { font-size: 13px; }

  .input-section { margin-bottom: 20px; }
  .input-box { height: 44px; border-radius: 11px; padding: 0 10px; }
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
  .line-btn { padding: 3px 8px; font-size: 11px; }

  .history-section { margin-bottom: 24px; }
  .history-index { width: 22px; height: 22px; font-size: 11px; }
  .history-play { display: none; }
  .history-time { display: none; }

  .tips-section { padding: 16px; border-radius: 12px; }
  .tips-list { padding-left: 16px; gap: 6px; }
  .tips-list li { font-size: 12px; }

  .input-mode-switch { border-radius: 8px; }
  .input-mode-btn { padding: 5px 12px; font-size: 11px; border-radius: 6px; }
  .search-row { height: 44px; border-radius: 11px; }
  .platform-select { padding: 3px 6px; font-size: 11px; }

  // 剧集分组手机适配
  .show-group-header { padding: 10px 12px; gap: 10px; flex-wrap: wrap; }
  .show-group-thumb { width: 80px; height: 45px; border-radius: 8px; }
  .show-group-name { font-size: 13px; }
  .show-group-meta { font-size: 11px; }
  .show-group-actions { gap: 6px; }
  .fetch-playlist-btn { padding: 3px 8px; font-size: 10px; }
  .show-episodes-panel { padding: 10px 12px; }
  .episodes-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .ep-title { font-size: 11px; }

  .search-results-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .card-info { padding: 8px 10px; }
  .card-title { font-size: 11px; }
  .card-duration { font-size: 10px; bottom: 4px; right: 4px; }
}
</style>

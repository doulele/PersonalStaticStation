<template>
  <div class="baby-sleep-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon :size="32"><Moon /></el-icon>
        宝宝哄睡
      </h1>
      <p class="page-desc">精选安抚音效 · 故事 · 诗歌，帮助宝宝安心入睡</p>
    </div>

    <!-- ====== 分类 Tab ====== -->
    <div class="category-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        <el-icon :size="16"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ====== 白噪音 ====== -->
    <div v-show="activeTab === 'whitenoise'" class="tab-content">
      <!-- 排序工具栏 -->
      <div class="sort-toolbar">
        <el-tooltip placement="top" effect="dark" raw-content>
          <template #content>仅统计你<i>主动点击</i>曲目的次数，<br/>列表循环/单曲循环不参与计数</template>
          <span class="sort-hint"><el-icon :size="14"><InfoFilled /></el-icon> 播放排名</span>
        </el-tooltip>
        <button class="sort-btn" :class="{ active: sortMode === 'playCount' }" @click="toggleSortMode">
          <el-icon :size="15"><Sort /></el-icon>
          <span>{{ sortMode === 'playCount' ? '按热度' : '按默认' }}</span>
        </button>
      </div>
      <div class="sound-grid">
        <div
          v-for="item in whiteNoiseItemsSorted" :key="item.id"
          class="sound-card"
          :class="{ active: selectedItem?.id === item.id, playing: isPlaying && selectedItem?.id === item.id }"
          @click="selectItem('noise', item)"
        >
          <div class="sound-icon" :class="item.color">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="sound-label">{{ item.label }}</div>
          <div class="play-count-badge" v-if="playCountMap[item.id] && sortMode === 'playCount'" :title="'播放 ' + playCountMap[item.id] + ' 次'">
            {{ playCountMap[item.id] >= 100 ? '99+' : playCountMap[item.id] }}次
          </div>
          <div class="sound-playing-dot" v-if="isPlaying && selectedItem?.id === item.id"></div>
          <div class="card-actions">
            <button class="card-action-btn edit" title="编辑" @click.stop="openEditModal('whitenoise', item)"><el-icon :size="13"><Edit /></el-icon></button>
            <button class="card-action-btn delete" title="删除" @click.stop="confirmDelete('whitenoise', item)"><el-icon :size="13"><Delete /></el-icon></button>
          </div>
        </div>
      </div>
      <button class="add-item-btn" @click="openEditModal('whitenoise')">
        <el-icon :size="14"><Plus /></el-icon> 新增白噪音
      </button>
    </div>

    <!-- ====== 故事/寓言/神曲/古诗/名篇 ====== -->
    <div v-show="activeTab !== 'whitenoise'" class="tab-content">
      <!-- 排序工具栏 -->
      <div class="sort-toolbar">
        <el-tooltip placement="top" effect="dark" raw-content>
          <template #content>仅统计你<i>主动点击</i>曲目的次数，<br/>列表循环/单曲循环不参与计数</template>
          <span class="sort-hint"><el-icon :size="14"><InfoFilled /></el-icon> 播放排名</span>
        </el-tooltip>
        <button class="sort-btn" :class="{ active: sortMode === 'playCount' }" @click="toggleSortMode">
          <el-icon :size="15"><Sort /></el-icon>
          <span>{{ sortMode === 'playCount' ? '按热度' : '按默认' }}</span>
        </button>
      </div>
      <div class="content-grid">
        <div
          v-for="item in currentContentItems" :key="item.id"
          class="content-card"
          :class="{ active: selectedItem?.id === item.id, playing: isPlaying && selectedItem?.id === item.id }"
        >
          <div class="content-main" @click="selectItem(item.id.startsWith('lullaby-') ? 'song' : 'tts', item)">
            <div class="content-icon" :class="currentContentIconClass">
              <el-icon :size="24"><component :is="currentContentIcon" /></el-icon>
            </div>
            <div class="content-info">
              <div class="content-title">
                {{ item.label }}
                <span class="play-count-badge inline" v-if="playCountMap[item.id] && sortMode === 'playCount'" :title="'播放 ' + playCountMap[item.id] + ' 次'">
                  {{ playCountMap[item.id] >= 100 ? '99+' : playCountMap[item.id] }}次
                </span>
              </div>
              <div class="content-meta">
                {{ item.meta }}
                <span class="audio-dot" v-if="activeTab === 'lullaby'" :class="{ has: item.audioUrl, none: !item.audioUrl }" :title="item.audioUrl ? '有音频' : '暂无音频'">
                  {{ item.audioUrl ? '♪' : '—' }}
                </span>
              </div>
            </div>
            <div class="content-playing-dot" v-if="isPlaying && selectedItem?.id === item.id"></div>
          </div>
          <div class="card-actions content-card-actions">
            <button class="card-action-btn edit" title="编辑" @click.stop="openEditModal(activeTab, item)"><el-icon :size="13"><Edit /></el-icon></button>
            <button class="card-action-btn delete" title="删除" @click.stop="confirmDelete(activeTab, item)"><el-icon :size="13"><Delete /></el-icon></button>
          </div>
        </div>
      </div>
      <button class="add-item-btn" @click="openEditModal(activeTab)">
        <el-icon :size="14"><Plus /></el-icon> 新增{{ currentTabLabel }}
      </button>
    </div>

    <!-- ====== 播放器控制栏（固定在底部） ====== -->
    <div class="player-panel" :class="{ active: isPlaying, visible: selectedItem }">
      <!-- 进度条 -->
      <div class="player-progress-bar" v-if="playerFeatures.showProgress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: ttsProgress + '%' }" :class="{ animating: isBuffering }"></div>
        </div>
      </div>

      <div class="player-inner">
        <!-- 左侧：封面 / 信息 -->
        <div class="player-left">
          <div class="player-cover" :class="{ active: isPlaying, disabled: !playerFeatures.canPlay }" @click="playerFeatures.canPlay && togglePlay()">
            <el-icon :size="20"><VideoPause v-if="isPlaying && playerFeatures.canPlay" /><VideoPlay v-else /></el-icon>
          </div>
          <div class="player-meta">
            <div class="player-title">{{ playingItemLabel }}</div>
            <div class="player-sub">
              <span class="player-type-badge" v-if="selectedItemType === 'noise'">白噪音</span>
              <span class="player-type-badge song" v-else-if="selectedItemType === 'song'">歌曲</span>
              <span class="player-song-note" v-if="selectedItemType === 'song' && !selectedItem?.audioUrl">无音频</span>
              <span class="player-type-badge tts" v-else-if="selectedItemType === 'tts'">朗读</span>
              <span class="player-buffering" v-if="isBuffering && selectedItemType === 'tts'">
                <el-icon :size="12" class="spinning"><Loading /></el-icon>
                加载中
              </span>
              <span class="player-timer-dot" v-if="timerMinutes > 0 && isPlaying">
                <el-icon :size="12"><Clock /></el-icon>
                {{ formattedRemaining }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧：控制按钮 -->
        <div class="player-right">
          <!-- 循环模式 -->
          <button class="ctrl-pill" :class="{ active: loopMode !== 'none', disabled: !playerFeatures.canLoop }" @click="playerFeatures.canLoop && toggleLoopMode()" :title="playerFeatures.canLoop ? loopModeTooltip : '当前类型不支持循环'">
            <span class="loop-icon-wrap">
              <svg v-if="loopMode === 'none'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v9h-9"/></svg>
              <svg v-else viewBox="0 0 28 24" width="28" height="24" class="loop-badge-svg">
                <circle cx="14" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M20 8 L18 6 M20 8 L18 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <text x="14" y="15.5" text-anchor="middle" font-size="9" fill="#9ca3af" font-weight="700">{{ loopMode === 'single' ? '1' : '列' }}</text>
              </svg>
            </span>
          </button>

          <!-- 音量下拉 -->
          <div class="ctrl-group dropdown-group" ref="volumeDropdownRef">
            <button class="ctrl-pill" :class="{ muted: volume === 0, disabled: !playerFeatures.canVolume }" @click.stop="playerFeatures.canVolume && toggleDropdown('volume')">
              <el-icon :size="15"><Mute v-if="volume === 0" /><Microphone v-else /></el-icon>
              <span>{{ volume }}</span>
            </button>
            <div class="dropdown-menu volume-drop" v-show="activeDropdown === 'volume'">
              <div class="volume-drop-row">
                <el-icon :size="14" class="vol-icon" @click="setVolume(0)"><Mute /></el-icon>
                <input type="range" class="volume-slider-drop" min="0" max="100" v-model.number="volume" @input="onVolumeChange" />
                <el-icon :size="16" class="vol-icon"><Microphone /></el-icon>
                <span class="vol-num">{{ volume }}</span>
              </div>
            </div>
          </div>

          <!-- 倍速 -->
          <div class="ctrl-group dropdown-group" ref="speedDropdownRef">
            <button class="ctrl-pill" :class="{ disabled: !playerFeatures.canSpeed }" @click.stop="playerFeatures.canSpeed && toggleDropdown('speed')">
              <el-icon :size="15"><Timer /></el-icon>
              <span>{{ playbackSpeed }}x</span>
            </button>
            <div class="dropdown-menu" v-show="activeDropdown === 'speed'">
              <div
                v-for="s in speedOptions" :key="s"
                class="dropdown-item" :class="{ active: playbackSpeed === s }"
                @click="setSpeed(s); activeDropdown = null"
              >{{ s }}x</div>
            </div>
          </div>

          <!-- 音色 -->
          <div class="ctrl-group dropdown-group" ref="voiceDropdownRef">
            <button class="ctrl-pill" :class="{ disabled: !playerFeatures.canVoice }" @click.stop="playerFeatures.canVoice && toggleDropdown('voice')">
              <el-icon :size="15"><User /></el-icon>
              <span>{{ currentVoiceLabel }}</span>
            </button>
            <div class="dropdown-menu voice-menu" v-show="activeDropdown === 'voice'">
              <div class="dropdown-section-title">预置音色</div>
              <div
                v-for="v in presetVoices" :key="v.id"
                class="dropdown-item" :class="{ active: selectedVoice === v.id && !customVoiceId }"
                @click="selectVoice(v.id); activeDropdown = null"
              >{{ v.label }} <span class="voice-desc">{{ v.desc }}</span></div>
              <template v-if="customVoices.length > 0">
                <div class="dropdown-section-title">我的音色</div>
                <div
                  v-for="v in customVoices" :key="v.id"
                  class="dropdown-item custom-voice-item" :class="{ active: customVoiceId === v.id }"
                  @click="selectCustomVoice(v); activeDropdown = null"
                >
                  <span>{{ v.label }}</span>
                  <button class="voice-delete-btn" @click.stop="deleteCustomVoice(v)" title="删除">×</button>
                </div>
              </template>
              <div class="dropdown-section-title" style="margin-top:6px">操作</div>
              <div class="dropdown-item add-voice" @click="openCloneWithPassword(); activeDropdown = null">
                <el-icon :size="14"><Plus /></el-icon> 添加我的声音
              </div>
            </div>
          </div>

          <!-- 定时 -->
          <div class="ctrl-group dropdown-group" ref="timerDropdownRef">
            <button class="ctrl-pill" :class="{ active: timerMinutes > 0, disabled: !playerFeatures.canTimer }" @click.stop="playerFeatures.canTimer && toggleDropdown('timer')">
              <el-icon :size="15"><Clock /></el-icon>
              <span>{{ timerMinutes > 0 ? timerMinutes + '\'' : '' }}</span>
            </button>
            <div class="dropdown-menu" v-show="activeDropdown === 'timer'">
              <div
                v-for="opt in timerOptions" :key="opt.value"
                class="dropdown-item" :class="{ active: timerMinutes === opt.value }"
                @click="setTimer(opt.value); activeDropdown = null"
              >{{ opt.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== 语音克隆密码验证弹窗 ====== -->
    <Teleport to="body">
      <div class="password-overlay" v-if="showPasswordModal" @click.self="closePasswordModal">
        <div class="password-modal">
          <div class="password-header">
            <h3><el-icon :size="20"><Lock /></el-icon> 功能授权</h3>
            <button class="password-close" @click="closePasswordModal">×</button>
          </div>
          <div class="password-body">
            <p class="password-desc">「添加我的声音」需要授权密码才能使用，避免误操作产生费用。</p>
            <div class="password-input-row">
              <input
                v-model="clonePassword"
                type="password"
                class="password-input"
                placeholder="请输入授权密码"
                @keydown.enter="verifyClonePassword"
                ref="passwordInputRef"
              />
            </div>
            <div class="password-error" v-if="passwordError">{{ passwordError }}</div>
          </div>
          <div class="password-footer">
            <button class="password-cancel-btn" @click="closePasswordModal">取消</button>
            <button class="password-submit-btn" @click="verifyClonePassword">确认</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== 语音克隆弹窗 ====== -->
    <Teleport to="body">
      <div class="clone-overlay" v-if="showCloneModal" @click.self="closeCloneModal">
        <div class="clone-modal">
          <div class="clone-header">
            <h3><el-icon :size="20"><Microphone /></el-icon> 添加我的声音</h3>
            <button class="clone-close" @click="closeCloneModal">×</button>
          </div>

          <!-- Tab 切换 -->
          <div class="clone-tabs">
            <button class="clone-tab" :class="{ active: cloneTab === 'record' }" @click="cloneTab = 'record'">
              录制声音
            </button>
            <button class="clone-tab" :class="{ active: cloneTab === 'upload' }" @click="cloneTab = 'upload'">
              上传音频
            </button>
          </div>

          <!-- 录制模式 -->
          <div class="clone-body" v-if="cloneTab === 'record'">
            <div class="record-area">
              <div class="record-visual" :class="{ recording: isRecording }">
                <div class="record-wave" v-if="isRecording">
                  <span v-for="n in 12" :key="n" class="wave-bar" :style="{ '--delay': n * 0.08 + 's', '--h': (60 + Math.random() * 40) + '%' }"></span>
                </div>
                <el-icon v-else :size="48"><Microphone /></el-icon>
              </div>
              <div class="record-timer" v-if="isRecording">{{ recordSeconds }}s / 20s</div>
              <div class="record-hint" v-if="!isRecording && !recordedBlob">
                请朗读一段 10~20 秒的文字，保持匀速清晰，环境安静
              </div>
              <div class="record-hint success" v-if="recordedBlob && !isRecording">
                ✓ 录制完成 ({{ recordedDuration }}秒)
              </div>
              <div class="record-actions">
                <button v-if="!isRecording && !recordedBlob" class="btn-record-start" @click="startRecording">
                  <el-icon :size="18"><VideoPlay /></el-icon> 开始录制
                </button>
                <button v-if="isRecording" class="btn-record-stop" @click="stopRecording">
                  <el-icon :size="18"><VideoPause /></el-icon> 停止录制
                </button>
                <button v-if="recordedBlob && !isRecording" class="btn-record-retry" @click="retryRecording">
                  重新录制
                </button>
                <button v-if="recordedBlob && !isRecording" class="btn-play-preview" @click="previewRecording">
                  <el-icon :size="14"><VideoPlay v-if="!isPreviewing" /><VideoPause v-else /></el-icon>
                  {{ isPreviewing ? '停止' : '试听' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 上传模式 -->
          <div class="clone-body" v-if="cloneTab === 'upload'">
            <div class="upload-area" :class="{ 'has-file': uploadedFile }" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
              <input ref="fileInputRef" type="file" accept="audio/*" style="display:none" @change="handleFileSelect" />
              <template v-if="!uploadedFile">
                <el-icon :size="36"><Upload /></el-icon>
                <p>点击或拖拽音频文件到此处</p>
                <p class="upload-hint">支持 MP3 / WAV / M4A，10~20 秒，无背景音</p>
              </template>
              <template v-else>
                <el-icon :size="28" class="file-icon"><VideoPlay /></el-icon>
                <p class="file-name">{{ uploadedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(uploadedFile.size) }}</p>
                <button class="btn-remove-file" @click.stop="uploadedFile = null">移除</button>
              </template>
            </div>
          </div>

          <!-- 音色名称 -->
          <div class="clone-name-row">
            <label>音色名称</label>
            <input
              v-model="cloneName"
              class="clone-name-input"
              placeholder="例如：妈妈的声音"
              maxlength="20"
            />
          </div>

          <!-- 底部按钮 -->
          <div class="clone-footer">
            <span class="clone-error" v-if="cloneError">{{ cloneError }}</span>
            <button class="clone-cancel-btn" @click="closeCloneModal">取消</button>
            <button
              class="clone-submit-btn"
              :disabled="!canSubmitClone || cloneSubmitting"
              @click="submitClone"
            >
              <el-icon v-if="cloneSubmitting" :size="14" class="spinning"><Loading /></el-icon>
              {{ cloneSubmitting ? '创建中...' : '创建我的音色' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ====== 编辑/新增弹窗 ====== -->
    <Teleport to="body">
      <div class="edit-overlay" v-if="showEditModal" @click.self="closeEditModal">
        <div class="edit-modal">
          <div class="edit-header">
            <h3>
              <el-icon :size="18"><EditPen /></el-icon>
              {{ isEditing ? '编辑' : '新增' }}{{ editCategoryLabel }}
            </h3>
            <button class="edit-close" @click="closeEditModal">×</button>
          </div>
          <div class="edit-body">
            <div class="edit-field">
              <label>{{ editTitleLabel }} <span class="required">*</span></label>
              <input v-model="editForm.title" class="edit-input" :placeholder="editTitlePlaceholder" />
            </div>
            <div class="edit-field" v-if="editShowAuthor">
              <label>{{ editAuthorLabel }}</label>
              <input v-model="editForm.author" class="edit-input" :placeholder="editAuthorPlaceholder" />
            </div>
            <div class="edit-field" v-if="editShowDynasty">
              <label>朝代</label>
              <input v-model="editForm.dynasty" class="edit-input" placeholder="唐/宋/元/明/清…" />
            </div>
            <div class="edit-field" v-if="editShowType">
              <label>类型</label>
              <select v-model="editForm.type" class="edit-input">
                <option value="">{{ editTypePlaceholder }}</option>
                <option v-for="opt in editTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="edit-field" v-if="editShowColor">
              <label>颜色主题</label>
              <div class="color-options">
                <button
                  v-for="c in colorOptions" :key="c.value"
                  class="color-dot"
                  :class="[c.value, { active: editForm.color === c.value }]"
                  :title="c.label"
                  @click="editForm.color = c.value"
                ></button>
              </div>
            </div>
            <div class="edit-field" v-if="editShowAudioUrl">
              <label>音频地址</label>
              <input v-model="editForm.audioUrl" class="edit-input" placeholder="MP3 文件链接或 CDN 地址，留空则仅展示信息" />
            </div>
            <div class="edit-field" v-if="editShowContent">
              <label>正文内容</label>
              <textarea v-model="editForm.content" class="edit-textarea" rows="6" placeholder="输入完整正文内容，用于 TTS 朗读…"></textarea>
            </div>
            <div class="edit-field-note" v-if="editShowContent">正文内容将用于 TTS 语音朗读，建议输入完整文本</div>
          </div>
          <div class="edit-footer">
            <span class="edit-error" v-if="editError">{{ editError }}</span>
            <button class="edit-cancel-btn" @click="closeEditModal">取消</button>
            <button class="edit-submit-btn" :disabled="!canSubmitEdit || editSubmitting" @click="submitEdit">
              <el-icon v-if="editSubmitting" :size="14" class="spinning"><Loading /></el-icon>
              {{ editSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 提示 -->
    <div class="tips-section">
      <div class="tip-card">
        <el-icon :size="20"><InfoFilled /></el-icon>
        <span>建议将音量调至适中，播放时请将设备放在离宝宝1-2米处。朗读采用微软 Edge TTS 免费引擎，音质自然，多音字处理优秀。首次使用请允许音频权限。</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, markRaw, nextTick } from 'vue'
import {
  Moon, VideoPlay, VideoPause, Mute, Microphone, InfoFilled,
  Headset, Sunny, Reading, Notebook, EditPen,
  Cloudy, WindPower, Promotion, Film, Bell, Umbrella, Ship, Watch, Collection,
  Timer, ArrowDown, User, Plus, Upload, Clock, Loading, Lock, Refresh,
  Sort,
  Edit, Delete
} from '@element-plus/icons-vue'

// ==================== 常量 ====================
const API_BASE = '/staticTool/api/family'

const noiseIconMap = {
  white: Headset, pink: Headset, brown: Headset,
  rain: Umbrella, thunder: Cloudy, ocean: Ship, stream: Sunny,
  fan: WindPower, campfire: Promotion, heartbeat: Watch, windchime: Bell, tvstatic: Film
}

function attachNoiseIcons(items) {
  return items.map(item => ({
    ...item,
    icon: markRaw(noiseIconMap[item.type] || Headset)
  }))
}

// ==================== 分类 Tabs ====================
const activeTab = ref('story')
const tabs = [
  { id: 'story', label: '睡前故事', icon: markRaw(Reading) },
  { id: 'fable', label: '寓言故事', icon: markRaw(Notebook) },
  { id: 'classics', label: '名人名篇', icon: markRaw(Collection) },
  { id: 'poetry', label: '古诗词', icon: markRaw(EditPen) },
  { id: 'whitenoise', label: '白噪音', icon: markRaw(Headset) },
  { id: 'lullaby', label: '哄睡神曲', icon: markRaw(Headset) },
]

function switchTab(id) { activeTab.value = id }

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab?.label || '内容'
})

const iconMap = {
  story: Reading, fable: Notebook, lullaby: Headset, poetry: EditPen, classics: Collection
}
const currentContentIcon = computed(() => markRaw(iconMap[activeTab.value] || Reading))
const iconClassMap = {
  story: 'story-icon', fable: 'fable-icon', lullaby: 'lullaby-icon', poetry: 'poetry-icon', classics: 'classics-icon'
}
const currentContentIconClass = computed(() => iconClassMap[activeTab.value] || 'story-icon')

// ==================== 内容数据 ====================
const whiteNoiseItems = ref([])
const storyItems = ref([])
const fableItems = ref([])
const lullabyItems = ref([])
const poetryItems = ref([])
const classicsItems = ref([])

// ==================== 播放次数排序 ====================
const PLAY_COUNT_KEY = 'babySleep_playCounts_v1'

/** 从 localStorage 读取播放次数 */
function loadPlayCounts() {
  try {
    const raw = localStorage.getItem(PLAY_COUNT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

/** 保存播放次数到 localStorage */
function savePlayCounts(map) {
  try { localStorage.setItem(PLAY_COUNT_KEY, JSON.stringify(map)) } catch {}
}

const playCountMap = ref(loadPlayCounts())
const sortMode = ref('default')

function toggleSortMode() {
  sortMode.value = sortMode.value === 'playCount' ? 'default' : 'playCount'
}

/** 递增某个 item 的播放次数（仅用户主动点击计数） */
function incrementPlayCount(item) {
  if (!item?.id) return
  const key = item.id
  const next = { ...playCountMap.value, [key]: (playCountMap.value[key] || 0) + 1 }
  playCountMap.value = next
  savePlayCounts(next)
}

const currentContentItems = computed(() => {
  const map = { story: storyItems, fable: fableItems, lullaby: lullabyItems, poetry: poetryItems, classics: classicsItems }
  const list = [...(map[activeTab.value]?.value || [])]
  if (sortMode.value === 'playCount') {
    return list.sort((a, b) => (playCountMap.value[b.id] || 0) - (playCountMap.value[a.id] || 0))
  }
  return list
})

/** 白噪音也支持按热度排序 */
const whiteNoiseItemsSorted = computed(() => {
  const list = [...whiteNoiseItems.value]
  if (sortMode.value === 'playCount') {
    return list.sort((a, b) => (playCountMap.value[b.id] || 0) - (playCountMap.value[a.id] || 0))
  }
  return list
})

function buildTtsText(item) {
  // 构建 TTS 朗读文本：标题 + 作者/出处 → 正文内容（不读简介 reason）
  const title = item.title || ''
  const author = item.author || item.artist || item.source || ''
  const content = item.content || ''
  let prefix = title
  if (author && author !== title) prefix = `${title}。${author}`
  if (content) return `${prefix}。${content}`
  // 无 content 时，使用 reason 作为兜底（避免完全没内容可读）
  const reason = item.reason || ''
  if (reason) return `${prefix}。${reason}`
  return prefix
}

async function fetchSleepContent() {
  try {
    const res = await fetch(`${API_BASE}/sleep-content?category=all`)
    const json = await res.json()
    if (json.success && json.data) {
      if (json.data.whitenoise?.length) whiteNoiseItems.value = attachNoiseIcons(json.data.whitenoise)
      // 名篇：需 map 为前端统一格式（原 API 字段为 title/author/dynasty/text）
      if (json.data.classics?.length) classicsItems.value = json.data.classics.map(item => ({
        id: `classic-${item.id}`,
        label: item.title,
        meta: `${item.dynasty} · ${item.author}`,
        text: item.text || buildTtsText(item),
        _raw: item
      }))
      if (json.data.poetry?.length) poetryItems.value = json.data.poetry.map(p => ({
        id: `poem-${p.id}`,
        label: p.title,
        meta: `${p.dynasty} · ${p.author} · ${p.type}`,
        text: buildTtsText(p),
        _raw: p
      }))
      if (json.data.lullaby?.length) lullabyItems.value = json.data.lullaby.map(item => ({
        id: `lullaby-${item.id}`,
        label: item.title,
        meta: `${item.artist} · ${item.type}`,
        text: buildTtsText(item),
        audioUrl: item.audio_url || '',
        _raw: item
      }))
      if (json.data.fable?.length) fableItems.value = json.data.fable.map(item => ({
        id: `fable-${item.id}`,
        label: item.title,
        meta: item.source,
        text: buildTtsText(item),
        _raw: item
      }))
      if (json.data.story?.length) storyItems.value = json.data.story.map(item => ({
        id: `story-${item.id}`,
        label: item.title,
        meta: item.author || item.source || '',
        text: buildTtsText(item),
        _raw: item
      }))
    }
  } catch (err) {
    console.warn('[babySleep] 获取数据失败:', err)
    whiteNoiseItems.value = attachNoiseIcons([
      { id: 'white', label: '白噪音', color: 'default', type: 'white' },
      { id: 'rain', label: '雨声', color: 'blue', type: 'rain' },
      { id: 'ocean', label: '海浪声', color: 'teal', type: 'ocean' },
      { id: 'fan', label: '风扇声', color: 'green', type: 'fan' }
    ])
  }
}

// ==================== CRUD 编辑弹窗 ====================
const showEditModal = ref(false)
const isEditing = ref(false)
const editCategory = ref('')
const editingItemId = ref(null)
const editError = ref('')
const editSubmitting = ref(false)
const editForm = ref({
  title: '',
  author: '',
  dynasty: '',
  type: '',
  color: 'default',
  content: ''
})

const editCategoryLabel = computed(() => {
  const map = { whitenoise: '白噪音', story: '睡前故事', fable: '寓言故事', lullaby: '哄睡神曲', poetry: '古诗文', classics: '名篇' }
  return map[editCategory.value] || '内容'
})

const isWhiteNoise = computed(() => editCategory.value === 'whitenoise')
const editTitleLabel = computed(() => isWhiteNoise.value ? '名称' : '标题')
const editTitlePlaceholder = computed(() => isWhiteNoise.value ? '例如：雨声' : '例如：静夜思')
const editShowAuthor = computed(() => !isWhiteNoise.value)
const editAuthorLabel = computed(() => {
  if (editCategory.value === 'lullaby') return '歌手'
  return '作者 / 出处'
})
const editAuthorPlaceholder = computed(() => {
  if (editCategory.value === 'lullaby') return '例如：周杰伦'
  return '例如：李白'
})
const editShowDynasty = computed(() => ['poetry', 'classics'].includes(editCategory.value))
const editShowType = computed(() => ['whitenoise', 'lullaby', 'poetry'].includes(editCategory.value))
const editTypePlaceholder = computed(() => {
  if (editCategory.value === 'lullaby') return '选择歌曲类型'
  if (editCategory.value === 'poetry') return '选择文体'
  return '选择声音类型'
})
const editTypeOptions = computed(() => {
  if (editCategory.value === 'whitenoise') return ['white', 'pink', 'brown', 'rain', 'thunder', 'ocean', 'stream', 'fan', 'campfire', 'heartbeat', 'windchime', 'tvstatic']
  if (editCategory.value === 'lullaby') return ['儿歌', '摇篮曲', '轻音乐', '流行', '古典']
  if (editCategory.value === 'poetry') return ['五言绝句', '七言绝句', '五言律诗', '七言律诗', '宋词', '元曲', '古体诗']
  return []
})
const editShowColor = computed(() => isWhiteNoise.value)
const colorOptions = [
  { value: 'default', label: '紫色' },
  { value: 'pink', label: '粉色' },
  { value: 'brown', label: '棕色' },
  { value: 'blue', label: '蓝色' },
  { value: 'indigo', label: '靛蓝' },
  { value: 'teal', label: '青色' },
  { value: 'cyan', label: '天蓝' },
  { value: 'green', label: '绿色' },
  { value: 'orange', label: '橙色' },
  { value: 'red', label: '红色' },
  { value: 'purple', label: '淡紫' },
  { value: 'gray', label: '灰色' }
]
const editShowContent = computed(() => !isWhiteNoise.value)
const editShowAudioUrl = computed(() => editCategory.value === 'lullaby')
const canSubmitEdit = computed(() => editForm.value.title.trim())

function resetEditForm() {
  editForm.value = { title: '', author: '', dynasty: '', type: '', color: 'default', content: '', audioUrl: '' }
  editError.value = ''
  editSubmitting.value = false
}

function openEditModal(category, item = null) {
  editCategory.value = category
  resetEditForm()
  if (item) {
    isEditing.value = true
    editingItemId.value = item.id
    editForm.value.title = item.label || ''
    editForm.value.author = item.meta || ''
    // 从原始数据中提取更多字段（如果可用）
    if (item._raw) {
      const r = item._raw
      editForm.value.author = r.author || r.artist || r.source || item.meta || ''
      editForm.value.dynasty = r.dynasty || ''
      editForm.value.type = r.type || ''
      editForm.value.content = r.content || r.text || ''
      editForm.value.audioUrl = r.audio_url || item.audioUrl || ''
    }
    if (category === 'whitenoise') {
      editForm.value.type = item.type || ''
      editForm.value.color = item.color || 'default'
    }
  } else {
    isEditing.value = false
    editingItemId.value = null
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  resetEditForm()
}

async function submitEdit() {
  if (!canSubmitEdit.value || editSubmitting.value) return
  editSubmitting.value = true
  editError.value = ''

  try {
    const category = editCategory.value
    const body = buildEditBody(category)

    const rawId = isEditing.value
      ? (editingItemId.value.includes('-') ? editingItemId.value.split('-').slice(1).join('-') : editingItemId.value)
      : null

    let res
    if (isEditing.value) {
      res = await fetch(`${API_BASE}/sleep-content/${rawId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, ...body })
      })
    } else {
      res = await fetch(`${API_BASE}/sleep-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, ...body })
      })
    }

    const json = await res.json()
    if (json.success) {
      closeEditModal()
      // 刷新数据
      await fetchSleepContent()
    } else {
      editError.value = json.error || '保存失败'
    }
  } catch (e) {
    console.error('[babySleep] 保存失败:', e)
    editError.value = '网络错误，请重试'
  } finally {
    editSubmitting.value = false
  }
}

function buildEditBody(category) {
  const f = editForm.value
  if (category === 'whitenoise') {
    return { title: f.title, type: f.type, color: f.color }
  }
  const body = { title: f.title, content: f.content }
  if (category === 'lullaby') {
    body.artist = f.author
    body.type = f.type
    body.audio_url = f.audioUrl || ''
  } else if (category === 'poetry') {
    body.author = f.author
    body.dynasty = f.dynasty
    body.type = f.type
  } else if (category === 'classics') {
    body.author = f.author
    body.dynasty = f.dynasty
  } else {
    // story / fable
    body.author = f.author
  }
  return body
}

async function confirmDelete(category, item) {
  // 提取原始 ID（去掉前缀如 story- fable- 等）
  const rawId = item.id.includes('-') ? item.id.split('-').slice(1).join('-') : item.id
  if (!confirm(`确定要删除「${item.label}」吗？此操作不可撤销。`)) return

  try {
    const res = await fetch(`${API_BASE}/sleep-content/${rawId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    })
    const json = await res.json()
    if (json.success) {
      // 从本地列表中移除
      removeItemFromList(category, item.id)
      // 如果正在播放该项，停止播放
      if (selectedItem.value?.id === item.id) {
        stopAllSounds()
        isPlaying.value = false
        selectedItem.value = null
        selectedItemType.value = ''
      }
    } else {
      alert(json.error || '删除失败')
    }
  } catch (e) {
    console.error('[babySleep] 删除失败:', e)
    alert('网络错误，请重试')
  }
}

function removeItemFromList(category, itemId) {
  const map = {
    whitenoise: whiteNoiseItems,
    story: storyItems,
    fable: fableItems,
    lullaby: lullabyItems,
    poetry: poetryItems,
    classics: classicsItems
  }
  const list = map[category]
  if (list) {
    list.value = list.value.filter(i => i.id !== itemId)
  }
}

// ==================== 音色配置 ====================
const presetVoices = ref([
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓', desc: '活泼温暖', type: 'preset' },
  { id: 'zh-CN-XiaoyiNeural', label: '晓依', desc: '甜美可爱', type: 'preset' },
  { id: 'zh-CN-YunxiaNeural', label: '云夏', desc: '可爱少年', type: 'preset' },
  { id: 'zh-CN-YunxiNeural', label: '云希', desc: '阳光少年', type: 'preset' },
  { id: 'zh-CN-YunyangNeural', label: '云扬', desc: '温暖男声', type: 'preset' },
  { id: 'zh-CN-YunjianNeural', label: '云健', desc: '沉稳磁性', type: 'preset' },
  { id: 'zh-CN-liaoning-XiaobeiNeural', label: '晓北', desc: '东北方言', type: 'preset' },
  { id: 'zh-CN-shaanxi-XiaoniNeural', label: '晓妮', desc: '陕西方言', type: 'preset' },
  { id: 'zh-HK-HiuGaaiNeural', label: '曉佳', desc: '粤语女声', type: 'preset' },
  { id: 'zh-HK-HiuMaanNeural', label: '曉曼', desc: '粤语女声', type: 'preset' },
  { id: 'zh-HK-WanLungNeural', label: '雲龍', desc: '粤语男声', type: 'preset' },
  { id: 'zh-TW-HsiaoChenNeural', label: '曉臻', desc: '台湾国语', type: 'preset' },
  { id: 'zh-TW-HsiaoYuNeural', label: '曉雨', desc: '台湾国语', type: 'preset' },
  { id: 'zh-TW-YunJheNeural', label: '雲哲', desc: '台湾国语', type: 'preset' }
])
const customVoices = ref([])
const selectedVoice = ref('zh-CN-XiaoxiaoNeural')  // Edge TTS 默认音色
const customVoiceId = ref(null)
const ttsAvailable = ref(true)  // Edge TTS 始终免费可用
const cloneAvailable = ref(false)
const cloneNeedPassword = ref(false)

const currentVoiceLabel = computed(() => {
  if (customVoiceId.value) {
    const cv = customVoices.value.find(v => v.id === customVoiceId.value)
    return cv ? cv.label : '晓晓'
  }
  const pv = presetVoices.value.find(v => v.id === selectedVoice.value)
  return pv ? pv.label : '晓晓'
})

function selectVoice(voiceId) {
  const wasPlaying = isPlaying.value
  stopAllSounds()
  isPlaying.value = false
  selectedVoice.value = voiceId
  customVoiceId.value = null
  if (wasPlaying) {
    isPlaying.value = true
    startPlayback()
  }
}

function selectCustomVoice(voice) {
  const wasPlaying = isPlaying.value
  stopAllSounds()
  isPlaying.value = false
  customVoiceId.value = voice.id
  selectedVoice.value = voice.id
  if (wasPlaying) {
    isPlaying.value = true
    startPlayback()
  }
}

async function fetchVoices() {
  try {
    const res = await fetch(`${API_BASE}/tts-voices`)
    const json = await res.json()
    if (json.success && json.data) {
      ttsAvailable.value = json.data.ttsAvailable !== false   // Edge TTS 始终可用
      cloneAvailable.value = json.data.cloneAvailable || false
      cloneNeedPassword.value = json.data.cloneNeedPassword !== false
      if (json.data.presetVoices) presetVoices.value = json.data.presetVoices
      if (json.data.customVoices) customVoices.value = json.data.customVoices
      if (json.data.defaultVoice) selectedVoice.value = json.data.defaultVoice
    }
  } catch (e) { console.warn('[babySleep] 获取音色失败:', e) }
}

async function deleteCustomVoice(voice) {
  try {
    await fetch(`${API_BASE}/tts/voice/${voice.id}`, { method: 'DELETE' })
    customVoices.value = customVoices.value.filter(v => v.id !== voice.id)
    if (customVoiceId.value === voice.id) {
      customVoiceId.value = null
      selectedVoice.value = 'Cherry'
    }
  } catch (e) { console.error('[babySleep] 删除音色失败:', e) }
}

// ==================== 语音克隆弹窗 ====================
const showCloneModal = ref(false)
const cloneTab = ref('record')
const cloneName = ref('')
const cloneError = ref('')
const cloneSubmitting = ref(false)

// 密码门控
const showPasswordModal = ref(false)
const clonePassword = ref('')
const passwordError = ref('')
const passwordInputRef = ref(null)
let pendingPasswordAction = null  // 验证通过后执行的操作

function openCloneWithPassword() {
  if (cloneNeedPassword.value) {
    showPasswordModal.value = true
    clonePassword.value = ''
    passwordError.value = ''
    pendingPasswordAction = 'openClone'
    nextTick(() => passwordInputRef.value?.focus())
  } else {
    openCloneModal()
  }
}

function verifyClonePassword() {
  // 简单本地验证：将该密码也同时发送到后端做最终验证
  if (!clonePassword.value.trim()) {
    passwordError.value = '请输入密码'
    return
  }
  passwordError.value = ''
  showPasswordModal.value = false
  if (pendingPasswordAction === 'openClone') {
    openCloneModal()
  }
  pendingPasswordAction = null
}

function closePasswordModal() {
  showPasswordModal.value = false
  clonePassword.value = ''
  passwordError.value = ''
  pendingPasswordAction = null
}

// 录制
const isRecording = ref(false)
const recordedBlob = ref(null)
const recordedDuration = ref(0)
const isPreviewing = ref(false)
const recordSeconds = ref(0)
let mediaRecorder = null
let recordTimer = null
let recordChunks = []
let recordStartTime = 0
let previewAudio = null

// 上传
const uploadedFile = ref(null)
const fileInputRef = ref(null)

const canSubmitClone = computed(() => {
  if (!cloneName.value.trim()) return false
  if (cloneTab.value === 'record' && !recordedBlob.value) return false
  if (cloneTab.value === 'upload' && !uploadedFile.value) return false
  return true
})

function openCloneModal() {
  showCloneModal.value = true
  cloneName.value = ''
  cloneError.value = ''
  cloneTab.value = 'record'
  recordedBlob.value = null
  recordedDuration.value = 0
  uploadedFile.value = null
}

function closeCloneModal() {
  showCloneModal.value = false
  stopRecording()
  if (previewAudio) { previewAudio.pause(); previewAudio = null }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    recordChunks = []
    recordStartTime = Date.now()
    isRecording.value = true
    recordSeconds.value = 0
    recordedBlob.value = null

    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      recordedBlob.value = new Blob(recordChunks, { type: 'audio/webm' })
      recordedDuration.value = Math.round((Date.now() - recordStartTime) / 1000)
      stream.getTracks().forEach(t => t.stop())
    }

    mediaRecorder.start(100)
    recordTimer = setInterval(() => {
      recordSeconds.value = Math.round((Date.now() - recordStartTime) / 1000)
      if (recordSeconds.value >= 20) stopRecording()
    }, 200)
  } catch (e) {
    console.error('[babySleep] 录制失败:', e)
    cloneError.value = '无法访问麦克风，请检查浏览器权限'
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  clearInterval(recordTimer)
}

function retryRecording() {
  recordedBlob.value = null
  recordedDuration.value = 0
  if (previewAudio) { previewAudio.pause(); previewAudio = null; isPreviewing.value = false }
}

function previewRecording() {
  if (isPreviewing.value) {
    previewAudio?.pause()
    isPreviewing.value = false
    return
  }
  if (!recordedBlob.value) return
  const url = URL.createObjectURL(recordedBlob.value)
  previewAudio = new Audio(url)
  previewAudio.onended = () => { isPreviewing.value = false }
  previewAudio.onerror = () => { isPreviewing.value = false }
  previewAudio.play()
  isPreviewing.value = true
}

function triggerFileInput() { fileInputRef.value?.click() }

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) uploadedFile.value = file
}

function handleFileDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadedFile.value = file
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 读取文件为 base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function submitClone() {
  if (!canSubmitClone.value || cloneSubmitting.value) return
  cloneSubmitting.value = true
  cloneError.value = ''

  try {
    let audioBase64 = null
    if (cloneTab.value === 'record' && recordedBlob.value) {
      audioBase64 = await fileToBase64(recordedBlob.value)
    } else if (cloneTab.value === 'upload' && uploadedFile.value) {
      audioBase64 = await fileToBase64(uploadedFile.value)
    }

    const res = await fetch(`${API_BASE}/tts/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, name: cloneName.value.trim(), clonePassword: clonePassword.value })
    })

    const json = await res.json()
    if (json.success && json.data) {
      customVoices.value.push({
        id: json.data.voiceId,
        label: json.data.label,
        desc: '自定义克隆音色',
        type: 'custom',
        voiceId: json.data.voiceId
      })
      customVoiceId.value = json.data.voiceId
      closeCloneModal()
    } else {
      cloneError.value = json.error || '音色创建失败'
    }
  } catch (e) {
    console.error('[babySleep] 克隆失败:', e)
    cloneError.value = '网络错误，请重试'
  } finally {
    cloneSubmitting.value = false
  }
}

// ==================== 全局播放状态 ====================
const selectedItem = ref(null)
const selectedItemType = ref('')
const isPlaying = ref(false)
const isBuffering = ref(false)
const ttsProgress = ref(0)
const volume = ref(50)
const playbackSpeed = ref(1.0)
const timerMinutes = ref(0)
const remainingSeconds = ref(0)
let timerInterval = null
let progressInterval = null

// 循环模式：single=单曲循环, list=列表循环, none=不循环
const loopMode = ref('list')
const loopModeTooltip = computed(() => {
  const map = { single: '单曲循环', list: '列表循环', none: '不循环' }
  return map[loopMode.value]
})

// 播放器各功能支持情况（用于置灰不可用按钮）
const playerFeatures = computed(() => {
  const type = selectedItemType.value
  const hasSongAudio = type === 'song' && selectedItem.value?.audioUrl
  const isTts = type === 'tts'
  const isNoise = type === 'noise'
  const isSong = type === 'song'
  // 有音频的歌曲：基础播放能力（无进度条/倍速/音色）；无音频的歌曲：完全不可用
  return {
    canPlay: isNoise || isTts || hasSongAudio,
    canLoop: isNoise || isTts || hasSongAudio,
    canVolume: isNoise || isTts || hasSongAudio,
    canSpeed: isTts,
    canVoice: isTts,
    canTimer: isNoise || isTts || hasSongAudio,
    showProgress: isTts,
  }
})

// 当前分类的内容列表
const currentItemList = computed(() => {
  const type = selectedItemType.value
  if (type === 'noise') return whiteNoiseItems.value
  if (type === 'tts' || type === 'song') return currentContentItems.value
  return []
})

function toggleLoopMode() {
  if (loopMode.value === 'single') loopMode.value = 'list'
  else if (loopMode.value === 'list') loopMode.value = 'none'
  else loopMode.value = 'single'
}

/** 播放列表中的下一首（列表循环） */
function playNextInList() {
  const list = currentItemList.value
  if (!list.length) return
  const currentId = selectedItem.value?.id
  const idx = list.findIndex(item => item.id === currentId)
  const nextIdx = idx < 0 || idx >= list.length - 1 ? 0 : idx + 1
  const nextItem = list[nextIdx]
  const type = selectedItemType.value
  // 直接切换（不通过 selectItem 避免重置状态）
  selectedItem.value = nextItem
  stopAllSounds()
  startPlayback()
}

const playingItemLabel = computed(() => selectedItem.value?.label || '未选择')

// ==================== 下拉菜单 ====================
const activeDropdown = ref(null)
const speedDropdownRef = ref(null)
const voiceDropdownRef = ref(null)
const timerDropdownRef = ref(null)
const volumeDropdownRef = ref(null)

function toggleDropdown(name) {
  activeDropdown.value = activeDropdown.value === name ? null : name
}

function handleClickOutside(e) {
  const refs = { speed: speedDropdownRef, voice: voiceDropdownRef, timer: timerDropdownRef, volume: volumeDropdownRef }
  const current = refs[activeDropdown.value]
  if (current?.value && !current.value.contains(e.target)) {
    activeDropdown.value = null
  }
}

// ==================== 倍速 ====================
const speedOptions = [0.6, 0.9, 1.0, 1.2, 1.5, 1.8]

function setSpeed(s) {
  playbackSpeed.value = s
  if (isPlaying.value && selectedItemType.value === 'tts') {
    stopAllSounds()
    if (customVoiceId.value) {
      playCloneTTS(selectedItem.value)
    } else {
      playEdgeTTS(selectedItem.value)
    }
  }
}

// ==================== Web Audio 引擎 ====================
let audioCtx = null
let songAudio = null // 歌曲播放器
let activeNodes = []

// TTS 音频缓存：key → AudioBuffer，避免重复请求后端合成
const ttsAudioCache = new Map()
const TTS_CACHE_MAX = 20

/** 生成缓存 key：itemId + voice + speed */
function getTtsCacheKey(itemId, voice, speed) {
  return `${itemId}::${voice}::${speed}`
}

/** 存入缓存（超过上限则删最旧的） */
function setTtsCache(key, audioBuffer) {
  if (ttsAudioCache.size >= TTS_CACHE_MAX) {
    const firstKey = ttsAudioCache.keys().next().value
    ttsAudioCache.delete(firstKey)
  }
  ttsAudioCache.set(key, audioBuffer)
}

/** 预加载下一首的 TTS 音频（不阻塞当前播放） */
async function prefetchNextTts() {
  const list = currentItemList.value
  if (!list.length || !selectedItem.value) return
  const currentId = selectedItem.value.id
  const idx = list.findIndex(item => item.id === currentId)
  if (idx < 0) return
  const nextIdx = idx >= list.length - 1 ? 0 : idx + 1
  const nextItem = list[nextIdx]
  if (!nextItem.text) return

  const voice = customVoiceId.value || selectedVoice.value
  const speed = +(playbackSpeed.value * 0.85).toFixed(2)
  const key = getTtsCacheKey(nextItem.id, voice, speed)
  if (ttsAudioCache.has(key)) return // 已缓存

  try {
    const endpoint = customVoiceId.value ? `${API_BASE}/tts` : `${API_BASE}/tts/edge`
    const body = customVoiceId.value
      ? { text: nextItem.text, customVoiceId: customVoiceId.value, speed, clonePassword: clonePassword.value }
      : { text: nextItem.text, voice, speed }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (json.success && json.data?.audio) {
      const ctx = getAudioContext()
      const audioData = base64ToArrayBuffer(json.data.audio)
      const audioBuffer = await ctx.decodeAudioData(audioData)
      setTtsCache(key, audioBuffer)
    }
  } catch {
    // 预加载失败不影响主流程，静默忽略
  }
}

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

/** 进度条追踪 */
function startProgressTracking(ctx, source, duration) {
  clearProgress()
  const startTime = ctx.currentTime
  const update = () => {
    if (!isPlaying.value) { clearProgress(); return }
    const elapsed = ctx.currentTime - startTime
    ttsProgress.value = Math.min((elapsed / (duration / source.playbackRate.value)) * 100, 99)
    progressInterval = requestAnimationFrame(update)
  }
  progressInterval = requestAnimationFrame(update)
}

function clearProgress() {
  if (progressInterval) { cancelAnimationFrame(progressInterval); progressInterval = null }
  ttsProgress.value = 0
}

function stopAllSounds() {
  stopBrowserTTS()
  stopAudioElement()
  stopSongAudio()
  clearProgress()
  isBuffering.value = false
  ttsRequestId++  // 取消所有进行中的异步 TTS 请求
  activeNodes.forEach(n => {
    try { n.stop?.() } catch (e) {}
    try { n.disconnect() } catch (e) {}
  })
  activeNodes = []
}

// ---- 歌曲音频播放 ----
function playSongAudio(url) {
  stopSongAudio()
  if (!url || (!url.startsWith('http') && !url.startsWith('/'))) {
    console.warn('[babySleep] 无效的音频地址，跳过播放:', url)
    isPlaying.value = false
    return
  }
  try {
    songAudio = new Audio(url)
    songAudio.volume = volume.value / 100
    songAudio.play().then(() => {
      isPlaying.value = true
    }).catch(err => {
      console.error('[babySleep] 歌曲播放失败:', err)
      isPlaying.value = false
      songAudio = null
    })
    songAudio.addEventListener('ended', () => {
      isPlaying.value = false
      songAudio = null
      // 列表循环
      if (loopMode.value === 'list') playNextInList()
      else if (loopMode.value === 'single') { songAudio = new Audio(url); songAudio.volume = volume.value / 100; songAudio.play() }
    })
  } catch (e) {
    console.error('[babySleep] 歌曲播放异常:', e)
    isPlaying.value = false
  }
}

function stopSongAudio() {
  if (songAudio) {
    try { songAudio.pause() } catch (e) {}
    songAudio = null
  }
}

// ---- 白噪音生成 ----
function createNoiseBuffer(type) {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 2
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
    }
  } else if (type === 'brown') {
    let lo = 0
    for (let i = 0; i < len; i++) { d[i] = (lo + 0.02 * (Math.random() * 2 - 1)) / 1.02; lo = d[i]; d[i] *= 3.5 }
  }
  return buf
}

function createRainBuffer(heavy) {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 2
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const prob = heavy ? 0.5 : 0.3; const amp = heavy ? 0.8 : 0.5
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.1
    if (Math.random() < prob) s += (Math.random() * 2 - 1) * amp
    d[i] = s
  }
  return buf
}

function createOceanBuffer() {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 4
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr; const env = Math.sin(t * 0.3 * Math.PI) * 0.5 + 0.5
    d[i] = (Math.random() * 2 - 1) * 0.3 * env * 1.5
  }
  return buf
}

function createStreamBuffer() {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 2
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.08
    if (Math.random() < 0.25) s += (Math.random() * 2 - 1) * 0.35
    s += Math.sin((i * 0.02) % (2 * Math.PI)) * 0.05
    d[i] = s
  }
  return buf
}

function createCampfireBuffer() {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 2
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.05
    if (Math.random() < 0.08) s += (Math.random() * 2 - 1) * (0.3 + Math.random() * 0.5)
    s += Math.sin(i / sr * 40 * Math.PI * 2) * 0.03
    d[i] = s
  }
  return buf
}

function createWindchimeBuffer() {
  const ctx = getAudioContext(); const sr = ctx.sampleRate; const len = sr * 3
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047]
  const chimeGap = sr * 0.8
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.02
    const noteIdx = Math.floor(i / chimeGap)
    if (noteIdx < 50) {
      const noteFreq = notes[Math.floor(Math.random() * notes.length)]
      const tInNote = (i % Math.floor(chimeGap)) / sr
      s += Math.sin(2 * Math.PI * noteFreq * tInNote) * Math.exp(-tInNote * 3) * 0.3
    }
    d[i] = s
  }
  return buf
}

function createNoise(type) {
  stopAllSounds()
  const ctx = getAudioContext(); let buf
  switch (type) {
    case 'white': buf = createNoiseBuffer('white'); break
    case 'pink': buf = createNoiseBuffer('pink'); break
    case 'brown': buf = createNoiseBuffer('brown'); break
    case 'rain': buf = createRainBuffer(false); break
    case 'thunder': buf = createRainBuffer(true); break
    case 'ocean': buf = createOceanBuffer(); break
    case 'stream': buf = createStreamBuffer(); break
    case 'fan': {
      buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) { const t = i / ctx.sampleRate; d[i] = Math.sin(120 * Math.PI * t) * 0.3 + Math.sin(180 * Math.PI * t) * 0.1 + (Math.random() * 2 - 1) * 0.08 }
      break
    }
    case 'campfire': buf = createCampfireBuffer(); break
    case 'windchime': buf = createWindchimeBuffer(); break
    case 'tvstatic': buf = createNoiseBuffer('white'); break
    default: buf = createNoiseBuffer('white')
  }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true
  let filter = null
  if (type === 'rain') { filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 2000 }
  else if (type === 'thunder') { filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1500 }
  else if (type === 'ocean') { filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800 }
  else if (type === 'tvstatic') { filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.5 }
  const gain = ctx.createGain(); gain.gain.value = volume.value / 100 * 0.5
  if (filter) { src.connect(filter); filter.connect(gain) } else { src.connect(gain) }
  gain.connect(ctx.destination); src.start()
  activeNodes.push(src, gain); if (filter) activeNodes.push(filter)
}

function playHeartbeat() {
  stopAllSounds(); const ctx = getAudioContext()
  const beat = () => {
    if (!isPlaying.value) return
    const t = ctx.currentTime
    const mk = (freq, gv, start, len) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gv, start + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, start + len)
      o.connect(g); g.connect(ctx.destination); o.start(start); o.stop(start + len)
      activeNodes.push(o, g)
    }
    mk(50, 0.5 * (volume.value / 100), t, 0.14)
    mk(50, 0.3 * (volume.value / 100), t + 0.16, 0.1)
  }
  beat()
  const iv = setInterval(() => {
    if (!isPlaying.value) { clearInterval(iv); return }
    activeNodes.forEach(n => { try { n.disconnect() } catch (e) {} }); activeNodes = []
    beat()
  }, 1000)
  activeNodes.push({ disconnect: () => clearInterval(iv) })
}

// ==================== TTS 播放（Edge TTS 免费 / 语音克隆 / 浏览器降级） ====================
let ttsAudioElement = null
let ttsRequestId = 0  // 请求 ID，用于取消旧请求

function stopAudioElement() {
  if (ttsAudioElement) {
    ttsAudioElement.pause()
    ttsAudioElement.src = ''
    ttsAudioElement = null
  }
}

// Edge TTS 播放（免费主力）
async function playEdgeTTS(item) {
  if (!item.text) {
    playBrowserTTS(item)
    return
  }

  stopAudioElement()
  clearProgress()
  isBuffering.value = true
  ttsProgress.value = 0

  const reqId = ++ttsRequestId
  const voice = selectedVoice.value
  const speed = +(playbackSpeed.value * 0.85).toFixed(2)
  const cacheKey = getTtsCacheKey(item.id, voice, speed)

  // 检查缓存
  let audioBuffer = ttsAudioCache.get(cacheKey) || null
  if (!audioBuffer) {
    try {
      const res = await fetch(`${API_BASE}/tts/edge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.text, voice, speed })
      })
      if (reqId !== ttsRequestId) return
      const json = await res.json()
      if (reqId !== ttsRequestId) return

      if (json.success && json.data?.audio) {
        const ctx = getAudioContext()
        const audioData = base64ToArrayBuffer(json.data.audio)
        audioBuffer = await ctx.decodeAudioData(audioData)
        setTtsCache(cacheKey, audioBuffer)
      } else {
        if (reqId !== ttsRequestId) return
        isBuffering.value = false
        console.warn('[babySleep] Edge TTS 失败，降级到浏览器 TTS')
        playBrowserTTS(item)
        return
      }
    } catch (e) {
      if (reqId !== ttsRequestId) return
      isBuffering.value = false
      console.warn('[babySleep] Edge TTS 异常，降级到浏览器 TTS:', e)
      playBrowserTTS(item)
      return
    }
  }

  // 创建播放（audioBuffer 来自缓存或刚刚 fetch 获取）
  if (reqId !== ttsRequestId) return
  if (!audioBuffer) return  // 理论上不会到这里，兜底
  const ctx = getAudioContext()
  const source = ctx.createBufferSource()
  source.buffer = audioBuffer
  // 后端已通过 SSML prosody rate 将语速烧录进音频，前端统一 1.0 倍速播放
  source.playbackRate.value = 1.0

  const gain = ctx.createGain()
  gain.gain.value = volume.value / 100
  source.connect(gain)
  gain.connect(ctx.destination)

  source.onended = () => {
    clearProgress()
    ttsProgress.value = 100
    if (!isPlaying.value || selectedItem.value?.id !== item.id) return
    if (loopMode.value === 'single') {
      playEdgeTTS(item)
    } else if (loopMode.value === 'list') {
      playNextInList()
    } else {
      stopAllSounds(); isPlaying.value = false; clearTimer()
    }
  }

  source.start()
  isBuffering.value = false
  startProgressTracking(ctx, source, audioBuffer.duration)
  ttsAudioElement = { pause: () => { try { source.stop(); clearProgress() } catch (e) {} }, source, gain }
  activeNodes.push(source, gain)

  // 后台预加载下一首
  if (loopMode.value === 'list') prefetchNextTts()
}

// 语音克隆 TTS 播放（付费，需密码）
async function playCloneTTS(item) {
  if (!item.text || !customVoiceId.value) {
    playEdgeTTS(item)
    return
  }

  stopAudioElement()
  clearProgress()
  isBuffering.value = true
  ttsProgress.value = 0

  const reqId = ++ttsRequestId
  const voice = customVoiceId.value
  const speed = +(playbackSpeed.value * 0.85).toFixed(2)
  const cacheKey = getTtsCacheKey(item.id, voice, speed)

  // 检查缓存
  let audioBuffer = ttsAudioCache.get(cacheKey) || null
  if (!audioBuffer) {
    try {
      const res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          customVoiceId: voice,
          speed,
          clonePassword: clonePassword.value
        })
      })
      if (reqId !== ttsRequestId) return
      const json = await res.json()
      if (reqId !== ttsRequestId) return

      if (json.success && json.data?.audio) {
        const ctx = getAudioContext()
        const audioData = base64ToArrayBuffer(json.data.audio)
        audioBuffer = await ctx.decodeAudioData(audioData)
        setTtsCache(cacheKey, audioBuffer)
      } else {
        if (reqId !== ttsRequestId) return
        isBuffering.value = false
        console.warn('[babySleep] 克隆 TTS 失败，降级到 Edge TTS')
        playEdgeTTS(item)
        return
      }
    } catch (e) {
      if (reqId !== ttsRequestId) return
      isBuffering.value = false
      console.warn('[babySleep] 克隆 TTS 异常:', e)
      playEdgeTTS(item)
      return
    }
  }

  // 创建播放
  if (reqId !== ttsRequestId) return
  if (!audioBuffer) return
  const ctx = getAudioContext()
  const source = ctx.createBufferSource()
  source.buffer = audioBuffer
  // 后端已通过 speech_rate 参数将语速烧录进音频，前端统一 1.0 倍速播放
  source.playbackRate.value = 1.0

  const gain = ctx.createGain()
  gain.gain.value = volume.value / 100
  source.connect(gain)
  gain.connect(ctx.destination)

  source.onended = () => {
    clearProgress()
    ttsProgress.value = 100
    if (!isPlaying.value || selectedItem.value?.id !== item.id) return
    if (loopMode.value === 'single') {
      playCloneTTS(item)
    } else if (loopMode.value === 'list') {
      playNextInList()
    } else {
      stopAllSounds(); isPlaying.value = false; clearTimer()
    }
  }

  source.start()
  isBuffering.value = false
  startProgressTracking(ctx, source, audioBuffer.duration)
  ttsAudioElement = { pause: () => { try { source.stop(); clearProgress() } catch (e) {} }, source, gain }
  activeNodes.push(source, gain)

  // 后台预加载下一首
  if (loopMode.value === 'list') prefetchNextTts()
}

function base64ToArrayBuffer(base64) {
  // 去除可能的 data URI 前缀 + 空白字符
  let raw = base64.replace(/^data:audio\/\w+;base64,/, '').replace(/\s/g, '')
  // URL-safe base64 转标准 base64
  raw = raw.replace(/-/g, '+').replace(/_/g, '/')
  // 补齐缺失的 padding
  while (raw.length % 4) raw += '='
  const binary = atob(raw)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// ==================== 浏览器 TTS 降级 ====================
let ttsUtterance = null

function stopBrowserTTS() {
  if (ttsUtterance) {
    window.speechSynthesis.cancel()
    ttsUtterance = null
  }
}

function playBrowserTTS(item) {
  stopAllSounds()
  stopBrowserTTS()
  if (!item.text) return
  const u = new SpeechSynthesisUtterance(item.text)
  u.lang = 'zh-CN'
  u.rate = playbackSpeed.value * 0.85
  u.pitch = 1.0
  u.volume = volume.value / 100
  u.onend = () => {
    if (!isPlaying.value || selectedItem.value?.id !== item.id) return
    if (loopMode.value === 'single') {
      playBrowserTTS(item)
    } else if (loopMode.value === 'list') {
      playNextInList()
    } else {
      stopAllSounds(); isPlaying.value = false; clearTimer()
    }
  }
  ttsUtterance = u
  window.speechSynthesis.speak(u)
}

// ==================== 统一控制 ====================
function selectItem(type, item) {
  incrementPlayCount(item)  // 仅用户主动点击才计数
  const wasPlaying = isPlaying.value
  stopAllSounds()
  isPlaying.value = false
  selectedItem.value = item
  selectedItemType.value = type
  // 自动续播（歌曲无音频时 startPlayback 会自动跳过）
  if (wasPlaying) {
    isPlaying.value = true
    startPlayback()
  }
}

function startPlayback() {
  if (!selectedItem.value) return
  stopAllSounds()
  const type = selectedItemType.value
  const item = selectedItem.value
  if (type === 'noise') {
    if (item.type === 'heartbeat') playHeartbeat()
    else createNoise(item.type)
  } else if (type === 'song') {
    // 歌曲播放：使用 audio_url，无 audio_url 则仅展示信息
    const url = item.audioUrl || ''
    if (url) {
      playSongAudio(url)
    } else {
      isPlaying.value = false
    }
  } else if (type === 'tts') {
    if (customVoiceId.value && cloneAvailable.value) {
      playCloneTTS(item)    // 语音克隆（付费，需密码）
    } else {
      playEdgeTTS(item)     // Edge TTS（免费主力）
    }
  }
}

function togglePlay() {
  if (!selectedItem.value) {
    selectedItem.value = whiteNoiseItems.value[0]
    selectedItemType.value = 'noise'
  }
  // 歌曲无音频不支持播放
  if (selectedItemType.value === 'song' && !selectedItem.value?.audioUrl) return
  if (isPlaying.value) {
    stopAllSounds()
    isPlaying.value = false
    clearTimer()
  } else {
    getAudioContext()
    isPlaying.value = true
    startPlayback()
    if (timerMinutes.value > 0) startTimer()
  }
}

function onVolumeChange() {
  if (selectedItemType.value === 'song' && songAudio) {
    songAudio.volume = volume.value / 100
    return
  }
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel()
  if (selectedItem.value && isPlaying.value) {
    stopAllSounds()
    startPlayback()
  }
}

function setVolume(val) { volume.value = val; onVolumeChange() }

// ==================== 定时器 ====================
const timerOptions = [
  { label: '不限时', value: 0 },
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '60分钟', value: 60 },
  { label: '90分钟', value: 90 }
]

const formattedRemaining = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${m}分${String(s).padStart(2, '0')}秒`
})

function setTimer(minutes) {
  timerMinutes.value = minutes
  if (minutes === 0) { clearTimer() }
  else if (isPlaying.value) { startTimer() }
}

function startTimer() {
  clearTimer()
  remainingSeconds.value = timerMinutes.value * 60
  timerInterval = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      clearTimer()
      stopAllSounds()
      isPlaying.value = false
    }
  }, 1000)
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  remainingSeconds.value = 0
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchSleepContent()
  fetchVoices()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  stopAllSounds()
  clearTimer()
  if (previewAudio) { previewAudio.pause(); previewAudio = null }
  if (songAudio) { songAudio.pause(); songAudio = null }
  if (audioCtx) { audioCtx.close() }
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.baby-sleep-page {
  padding: 40px 24px 140px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
  min-height: 100vh;
  background: #ffffff; // 纯白背景，与深色播放器对比明显
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

// ====== 页面头部 ======
.page-header { text-align: center; margin-bottom: 20px; }
.page-title {
  font-size: 32px; font-weight: 700; color: #1e1b4b;
  display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 6px;
  .el-icon { color: #a855f7; }
}
.page-desc { font-size: 14px; color: #64748b; }

// ====== 分类 Tab ======
.category-tabs {
  display: flex; gap: 4px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 18px;
  scrollbar-width: none; &::-webkit-scrollbar { display: none; }
}
.tab-btn {
  display: flex; align-items: center; gap: 5px; padding: 8px 14px;
  border-radius: 8px; border: 1px solid #e2e8f0; background: #fff;
  font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer;
  white-space: nowrap; transition: all 0.2s; flex-shrink: 0;
  &:hover { border-color: #a78bfa; color: #6366f1; background: #faf9ff; }
  &.active { background: #6366f1; color: #fff; border-color: #6366f1; }
}

// ====== 内容区 ======
.tab-content { animation: fadeUp 0.3s ease-out; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

// 排序工具栏
.sort-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px; padding: 0 2px;
}
.sort-hint {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #94a3b8; cursor: pointer;
  transition: color 0.15s;
  &:hover { color: #6366f1; }
  .el-icon { flex-shrink: 0; }
}
.sort-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border: 1.5px solid #e2e8f0; border-radius: 6px;
  background: #fff; color: #64748b; font-size: 12px; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #a78bfa; color: #6366f1; }
  &.active {
    background: linear-gradient(135deg, #f0edff, #ede9fe);
    border-color: #a78bfa; color: #7c3aed; font-weight: 600;
  }
}

.sound-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.content-grid { display: flex; flex-direction: column; gap: 8px; }

// 白噪音卡片
.sound-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 6px; background: #fff; border: 2px solid #e2e8f0; border-radius: 10px;
  cursor: pointer; transition: all 0.2s; position: relative;
  &:hover { border-color: #a78bfa; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.06); }
  &.active { border-color: #a78bfa; background: #faf9ff; }
  &.playing { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.08); }
}
.sound-icon {
  width: 42px; height: 42px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff;
  &.default { background: linear-gradient(135deg, #6366f1, #818cf8); }
  &.pink { background: linear-gradient(135deg, #ec4899, #f472b6); }
  &.brown { background: linear-gradient(135deg, #92400e, #b45309); }
  &.blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
  &.indigo { background: linear-gradient(135deg, #4338ca, #6366f1); }
  &.teal { background: linear-gradient(135deg, #0d9488, #2dd4bf); }
  &.cyan { background: linear-gradient(135deg, #0891b2, #22d3ee); }
  &.green { background: linear-gradient(135deg, #10b981, #34d399); }
  &.orange { background: linear-gradient(135deg, #f97316, #fb923c); }
  &.red { background: linear-gradient(135deg, #ef4444, #f87171); }
  &.purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
  &.gray { background: linear-gradient(135deg, #64748b, #94a3b8); }
}
.sound-label { font-size: 11px; font-weight: 500; color: #475569; text-align: center; line-height: 1.2; }
.sound-playing-dot {
  position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%;
  background: #7c3aed; animation: blink 0.8s ease-in-out infinite;
}
@keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }

// 卡片悬浮操作按钮
.card-actions {
  position: absolute; top: 6px; right: 6px;
  display: flex; gap: 3px;
  opacity: 0; transition: opacity 0.2s;
}
.sound-card:hover .card-actions,
.content-card:hover .card-actions {
  opacity: 1;
}
.card-action-btn {
  width: 26px; height: 26px; border-radius: 5px; border: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.15s; padding: 0;
  &.edit {
    background: rgba(99, 102, 241, 0.1); color: #6366f1;
    &:hover { background: #6366f1; color: #fff; }
  }
  &.delete {
    background: rgba(239, 68, 68, 0.1); color: #ef4444;
    &:hover { background: #ef4444; color: #fff; }
  }
}

// 播放次数徽章
.play-count-badge {
  font-size: 10px; font-weight: 500; color: #7c3aed;
  background: #f0edff; border-radius: 4px; padding: 1px 6px;
  white-space: nowrap; flex-shrink: 0;
  &.inline { margin-left: 4px; }
}
.add-item-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; margin-top: 10px;
  border: 1.5px dashed #c4b5fd; border-radius: 8px;
  background: #faf9ff; color: #6366f1;
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #f0edff; border-color: #a78bfa; }
}

// 内容卡片
.content-card {
  display: flex; align-items: center; padding: 0;
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
  transition: all 0.2s; position: relative; overflow: hidden;
  &:hover { border-color: #a78bfa; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.04); }
  &.active { border-color: #a78bfa; background: #faf9ff; }
  &.playing { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.06); }
}
.content-main {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  flex: 1; min-width: 0; cursor: pointer;
}
.content-card-actions {
  position: static; opacity: 0; flex-shrink: 0;
  padding-right: 8px;
}
.content-icon {
  width: 40px; height: 40px; min-width: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; color: #fff;
  &.story-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
  &.fable-icon { background: linear-gradient(135deg, #ec4899, #f472b6); }
  &.lullaby-icon { background: linear-gradient(135deg, #10b981, #34d399); }
  &.poetry-icon { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
  &.classics-icon { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
}
.content-info { flex: 1; min-width: 0; }
.content-title { font-size: 15px; font-weight: 600; color: #1e1b4b; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; }
.content-meta { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
.audio-dot {
  flex-shrink: 0; font-size: 11px;
  &.has { color: #10b981; }
  &.none { color: #cbd5e1; }
}
.content-playing-dot {
  position: absolute; top: 10px; right: 10px; width: 7px; height: 7px; border-radius: 50%;
  background: #7c3aed; animation: blink 0.8s ease-in-out infinite;
}

// ====== 播放器控制面板（底部固定，全宽通栏） ======
.player-panel {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: linear-gradient(180deg, #2d2a35 0%, #1a1822 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.25);
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  &.visible { transform: translateY(0); }
  &.active { box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.35); }
}

.player-progress-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.progress-track {
  width: 100%; height: 100%; background: rgba(255, 255, 255, 0.08);
}
.progress-fill {
  height: 100%; background: linear-gradient(90deg, #818cf8, #a78bfa);
  transition: width 0.25s linear;
  &.animating {
    width: 30% !important;
    animation: progressIndeterminate 1.5s ease-in-out infinite;
  }
}
@keyframes progressIndeterminate {
  0% { transform: translateX(-100%); opacity: 0.5; }
  50% { transform: translateX(120%); opacity: 1; }
  100% { transform: translateX(240%); opacity: 0.5; }
}

.player-inner {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px 10px;
}

// 左侧：封面+信息
.player-left {
  display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;
}
.player-cover {
  width: 40px; height: 40px; min-width: 40px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex; align-items: center; justify-content: center;
  color: #a78bfa; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(167, 139, 250, 0.12); border-color: rgba(167, 139, 250, 0.3); color: #c4b5fd; }
  &.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
  &.disabled {
    opacity: 0.35; cursor: not-allowed; pointer-events: none;
  }
}
.player-meta { flex: 1; min-width: 0; }
.player-title {
  font-size: 13px; font-weight: 600; color: #e2dee9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.player-sub {
  display: flex; align-items: center; gap: 6px; margin-top: 2px;
}
.player-type-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 3px;
  background: rgba(167, 139, 250, 0.12); color: #a78bfa; font-weight: 500;
  &.song { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
  &.tts { background: rgba(52, 211, 153, 0.12); color: #34d399; }
}
.player-song-note {
  font-size: 10px; color: #94a3b8; margin-left: 2px;
  user-select: none;
}
.player-buffering {
  display: flex; align-items: center; gap: 3px;
  font-size: 10px; color: #a78bfa;
}
.player-timer-dot {
  display: flex; align-items: center; gap: 3px;
  font-size: 10px; color: #f59e0b; font-weight: 600;
}

// 右侧：控制区
.player-right {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}

// 通用药丸按钮
.ctrl-pill {
  position: relative;
  display: flex; align-items: center; gap: 3px;
  height: 32px; padding: 0 9px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
  &:hover { background: rgba(255, 255, 255, 0.08); color: #c4b5fd; border-color: rgba(167, 139, 250, 0.25); }
  &.active { background: rgba(167, 139, 250, 0.12); border-color: rgba(167, 139, 250, 0.3); color: #a78bfa; }
  &.muted { color: #6b7280; }
  &.disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
}

// 循环图标
.loop-icon-wrap {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  svg { color: inherit; width: 100%; height: 100%; }
}
.loop-badge-svg {
  circle, path, text { color: inherit; }
}


// 下拉按钮组
.dropdown-group { position: relative; }
.dropdown-menu {
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  background: #2d2a38; border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 130px; padding: 4px; z-index: 200;
  max-height: 260px; overflow-y: auto;
}

.dropdown-section-title {
  font-size: 10px; font-weight: 600; color: #6b7280; padding: 6px 10px 2px; letter-spacing: 0.5px;
}

.dropdown-item {
  padding: 7px 12px; font-size: 12px; color: #cbd5e1; cursor: pointer;
  border-radius: 4px; transition: all 0.1s; white-space: nowrap;
  display: flex; align-items: center; gap: 6px;
  &:hover { background: rgba(167, 139, 250, 0.1); color: #e2e8f0; }
  &.active { background: rgba(167, 139, 250, 0.15); color: #a78bfa; font-weight: 600; }
  .voice-desc { font-size: 11px; color: #6b7280; font-weight: 400; }
}

.custom-voice-item {
  justify-content: space-between;
  .voice-delete-btn {
    width: 18px; height: 18px; border-radius: 3px; border: none;
    background: rgba(239, 68, 68, 0.15); color: #f87171; font-size: 13px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; padding: 0; line-height: 1;
    &:hover { background: rgba(239, 68, 68, 0.25); }
  }
}

.add-voice {
  color: #a78bfa; font-weight: 500; gap: 6px;
  &:hover { background: rgba(167, 139, 250, 0.1); }
}

.voice-menu { min-width: 190px; }

// 音量下拉
.volume-drop { min-width: 180px; padding: 8px 10px; }
.volume-drop-row {
  display: flex; align-items: center; gap: 6px;
  .vol-icon { color: #9ca3af; cursor: pointer; flex-shrink: 0; &:hover { color: #c4b5fd; } }
  .vol-num { font-size: 12px; font-weight: 600; color: #a78bfa; min-width: 24px; text-align: right; }
}
.volume-slider-drop {
  flex: 1; -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px;
  background: rgba(255, 255, 255, 0.12); outline: none; cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px; border-radius: 2px;
    background: #a78bfa; cursor: pointer;
  }
}

// ====== 密码验证弹窗 ======
.password-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;
}
.password-modal {
  background: #fff; border-radius: 12px; width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: modalIn 0.3s ease-out; overflow: hidden;
}
.password-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
  h3 { font-size: 16px; font-weight: 600; color: #1e1b4b; display: flex; align-items: center; gap: 8px; margin: 0; }
  .el-icon { color: #f59e0b; }
}
.password-close {
  width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9;
  font-size: 18px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: #e2e8f0; }
}
.password-body { padding: 20px; }
.password-desc { font-size: 13px; color: #64748b; margin: 0 0 14px; line-height: 1.6; }
.password-input-row { margin-bottom: 8px; }
.password-input {
  width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
  &:focus { border-color: #6366f1; }
}
.password-error { font-size: 12px; color: #ef4444; margin-top: 4px; }
.password-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #f1f5f9;
}
.password-cancel-btn {
  padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 13px; color: #64748b; cursor: pointer;
  &:hover { background: #f8fafc; }
}
.password-submit-btn {
  padding: 8px 20px; border-radius: 6px; border: none;
  background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff;
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  &:hover { opacity: 0.9; }
}

// ====== 语音克隆弹窗 ======
.clone-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.clone-modal {
  background: #fff; border-radius: 12px; width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; animation: modalIn 0.3s ease-out;
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.clone-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
  h3 { font-size: 16px; font-weight: 600; color: #1e1b4b; display: flex; align-items: center; gap: 8px; margin: 0; }
}
.clone-close {
  width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9;
  font-size: 18px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: #e2e8f0; }
}

.clone-tabs { display: flex; padding: 12px 20px 0; gap: 4px; }
.clone-tab {
  flex: 1; padding: 8px; border: none; background: #f1f5f9; border-radius: 6px 6px 0 0;
  font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s;
  &.active { background: #fff; color: #6366f1; font-weight: 600; }
}

.clone-body { padding: 16px 20px; }

.record-area { text-align: center; }
.record-visual {
  width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 12px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex; align-items: center; justify-content: center; transition: all 0.3s;
  .el-icon { color: #94a3b8; }
  &.recording { background: linear-gradient(135deg, #fecaca, #fca5a5); box-shadow: 0 0 30px rgba(239,68,68,0.2); animation: pulse-rec 1.5s ease-in-out infinite; }
}
@keyframes pulse-rec { 0%,100% { box-shadow: 0 0 20px rgba(239,68,68,0.2); } 50% { box-shadow: 0 0 40px rgba(239,68,68,0.35); } }
.record-wave { display: flex; align-items: center; gap: 3px; height: 40px; }
.wave-bar {
  width: 3px; height: var(--h); background: #ef4444; border-radius: 2px;
  animation: wave 0.6s ease-in-out infinite alternate; animation-delay: var(--delay);
}
@keyframes wave { to { height: 20%; } }
.record-timer { font-size: 14px; font-weight: 600; color: #ef4444; margin-bottom: 8px; }
.record-hint { font-size: 12px; color: #94a3b8; margin-bottom: 12px; line-height: 1.5; &.success { color: #16a34a; } }
.record-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

.btn-record-start, .btn-record-stop, .btn-record-retry, .btn-play-preview, .btn-remove-file {
  padding: 10px 20px; border-radius: 8px; border: none; font-size: 13px; font-weight: 500;
  cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-record-start { background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; &:hover { opacity: 0.9; } }
.btn-record-stop { background: #1e1b4b; color: #fff; &:hover { opacity: 0.9; } }
.btn-record-retry { background: #f1f5f9; color: #475569; &:hover { background: #e2e8f0; } }
.btn-play-preview { background: #eef2ff; color: #6366f1; &:hover { background: #e0e7ff; } }
.btn-remove-file { background: #fee2e2; color: #ef4444; &:hover { background: #fecaca; } }

.upload-area {
  border: 2px dashed #e2e8f0; border-radius: 10px; padding: 30px 20px;
  text-align: center; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: #c4b5fd; background: #faf9ff; }
  &.has-file { border-style: solid; border-color: #a78bfa; background: #f5f3ff; }
  p { font-size: 13px; color: #64748b; margin: 8px 0 0; }
  .upload-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  .file-name { font-size: 14px; font-weight: 600; color: #1e1b4b; }
  .file-size { font-size: 12px; color: #94a3b8; }
  .el-icon { color: #c4b5fd; }
}

.clone-name-row {
  display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-top: 1px solid #f1f5f9;
  label { font-size: 13px; font-weight: 500; color: #475569; flex-shrink: 0; }
}
.clone-name-input {
  flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 14px; outline: none; transition: border-color 0.2s;
  &:focus { border-color: #6366f1; }
}

.clone-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #f1f5f9;
}
.clone-error { font-size: 12px; color: #ef4444; flex: 1; }
.clone-cancel-btn {
  padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 13px; color: #64748b; cursor: pointer;
  &:hover { background: #f8fafc; }
}
.clone-submit-btn {
  padding: 8px 20px; border-radius: 6px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

// ====== 编辑/新增弹窗 ======
.edit-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 20px;
}
.edit-modal {
  background: #fff; border-radius: 12px; width: 100%; max-width: 460px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: modalIn 0.3s ease-out; overflow: hidden;
  max-height: 90vh; display: flex; flex-direction: column;
}
.edit-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
  h3 {
    font-size: 16px; font-weight: 600; color: #1e1b4b; margin: 0;
    display: flex; align-items: center; gap: 8px;
    .el-icon { color: #6366f1; }
  }
}
.edit-close {
  width: 32px; height: 32px; border-radius: 50%; border: none; background: #f1f5f9;
  font-size: 18px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: #e2e8f0; }
}
.edit-body {
  padding: 16px 20px; overflow-y: auto; flex: 1;
}
.edit-field {
  margin-bottom: 14px;
  label { display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 5px; }
  .required { color: #ef4444; }
}
.edit-input {
  width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 7px;
  font-size: 14px; color: #1e1b4b; outline: none; transition: border-color 0.2s;
  background: #fff; box-sizing: border-box;
  &:focus { border-color: #6366f1; }
}
.edit-textarea {
  width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 7px;
  font-size: 13px; color: #1e1b4b; outline: none; transition: border-color 0.2s;
  background: #fff; box-sizing: border-box; resize: vertical; line-height: 1.7;
  font-family: inherit;
  &:focus { border-color: #6366f1; }
}
.edit-field-note {
  font-size: 11px; color: #94a3b8; margin-top: -8px; margin-bottom: 12px;
}
.color-options {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.color-dot {
  width: 26px; height: 26px; border-radius: 6px; border: 2px solid transparent;
  cursor: pointer; padding: 0; transition: all 0.15s;
  &.default { background: linear-gradient(135deg, #6366f1, #818cf8); }
  &.pink { background: linear-gradient(135deg, #ec4899, #f472b6); }
  &.brown { background: linear-gradient(135deg, #92400e, #b45309); }
  &.blue { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
  &.indigo { background: linear-gradient(135deg, #4338ca, #6366f1); }
  &.teal { background: linear-gradient(135deg, #0d9488, #2dd4bf); }
  &.cyan { background: linear-gradient(135deg, #0891b2, #22d3ee); }
  &.green { background: linear-gradient(135deg, #10b981, #34d399); }
  &.orange { background: linear-gradient(135deg, #f97316, #fb923c); }
  &.red { background: linear-gradient(135deg, #ef4444, #f87171); }
  &.purple { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
  &.gray { background: linear-gradient(135deg, #64748b, #94a3b8); }
  &.active { border-color: #1e1b4b; transform: scale(1.15); box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
  &:hover:not(.active) { transform: scale(1.1); }
}
.edit-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #f1f5f9; flex-shrink: 0;
}
.edit-error { font-size: 12px; color: #ef4444; flex: 1; }
.edit-cancel-btn {
  padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; font-size: 13px; color: #64748b; cursor: pointer;
  &:hover { background: #f8fafc; }
}
.edit-submit-btn {
  padding: 8px 20px; border-radius: 6px; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ====== 提示 ======
.tips-section { margin-top: 28px; padding-bottom: 20px; }
.tip-card {
  display: flex; align-items: flex-start; gap: 8px; padding: 14px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
  font-size: 12px; color: #92400e; line-height: 1.6;
  .el-icon { flex-shrink: 0; color: #f59e0b; margin-top: 1px; }
}

// ====== 响应式 ======
@media (max-width: 768px) {
  .baby-sleep-page { padding: 20px 14px 140px; }
  .page-title { font-size: 24px; }
  .sound-grid { grid-template-columns: repeat(3, 1fr); }
  .category-tabs { gap: 3px; }
  .tab-btn { padding: 5px 8px; font-size: 11px; gap: 3px; }
  .tab-btn .el-icon { display: none; }
  .player-inner { padding: 8px 12px 10px; gap: 8px; }
  .player-right { gap: 8px; }
  .ctrl-pill { height: 38px; padding: 0 12px; font-size: 12px; gap: 4px; min-width: 38px; justify-content: center; }
  .ctrl-pill .el-icon { font-size: 18px !important; }
  .loop-icon-wrap { width: 28px; height: 28px; }
  .player-cover { width: 42px; height: 42px; min-width: 42px; }
  .player-title { max-width: 150px; }
  .dropdown-item { padding: 10px 14px; font-size: 13px; }
  .dropdown-menu { min-width: 120px; }
  .voice-menu { min-width: 180px; }
}
@media (max-width: 480px) {
  .baby-sleep-page { padding: 16px 10px 130px; }
  .page-title { font-size: 20px; }
  .category-tabs { gap: 3px; flex-wrap: wrap; overflow-x: visible; }
  .tab-btn { padding: 4px 7px; font-size: 10px; gap: 2px; }
  .tab-btn .el-icon { display: none; }
  .sound-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .sound-card { padding: 10px 4px; }
  .sound-icon { width: 36px; height: 36px; }
  .content-card { padding: 10px 12px; }
  .content-icon { width: 34px; height: 34px; min-width: 34px; }
  .clone-modal { max-width: 100%; border-radius: 16px 16px 0 0; margin-top: auto; }
  .player-inner { padding: 8px 10px 10px; gap: 6px; }
  .player-left { gap: 6px; }
  .player-cover { width: 38px; height: 38px; min-width: 38px; }
  .player-title { font-size: 12px; max-width: 120px; }
  .player-sub { font-size: 10px; gap: 3px; }
  .player-right { gap: 6px; }
  .ctrl-pill { height: 36px; padding: 0 10px; font-size: 11px; gap: 4px; min-width: 36px; justify-content: center; }
  .ctrl-pill .el-icon { font-size: 17px !important; }
  .loop-icon-wrap { width: 28px; height: 28px; }
  .ctrl-pill span:not(.loop-icon-wrap) { display: none; } // 移动端隐藏文字只显示图标
  .dropdown-item { padding: 10px 14px; font-size: 13px; }
  .dropdown-menu { min-width: 110px; left: auto; right: 0; transform: none; }
  .voice-menu { min-width: 160px; }
}
</style>

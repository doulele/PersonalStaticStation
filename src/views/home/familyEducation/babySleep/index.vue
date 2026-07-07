<template>
  <div class="baby-sleep-page" :class="{ 'dark-mode': isDarkMode }">
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
          <div class="audio-source-badge" v-if="item.audioUrl && OSS_BASE_URL">真实音效</div>
          <div class="play-count-badge" v-if="playCountMap[item.id] && sortMode === 'playCount'" :title="'播放 ' + playCountMap[item.id] + ' 次'">
            {{ playCountMap[item.id] >= 100 ? '99+' : playCountMap[item.id] }}次
          </div>
          <div class="sound-playing-dot" v-if="isPlaying && selectedItem?.id === item.id"></div>
        </div>
      </div>
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

      <!-- ====== 哄睡神曲：在线搜索 ====== -->
      <div v-if="activeTab === 'lullaby'" class="online-search-panel">
        <div class="search-input-row">
          <div class="search-input-wrap">
            <el-icon :size="16" class="search-icon"><Search /></el-icon>
            <input
              v-model="searchQuery"
              class="search-input"
              placeholder="搜索歌曲：儿歌 / 摇篮曲 / 轻音乐..."
              @keydown.enter="handleSearch"
            />
            <button v-if="searchQuery" class="search-clear-btn" @click="clearSearch"><el-icon :size="12"><Close /></el-icon></button>
          </div>
          <select v-model="searchPlatform" class="platform-select">
            <option value="bilibili">B站</option>
            <option value="youtube">YouTube</option>
          </select>
          <button class="search-btn" :disabled="searchLoading || !searchQuery.trim()" @click="handleSearch">
            <el-icon v-if="!searchLoading" :size="14"><Search /></el-icon>
            <el-icon v-else :size="14" class="spinning"><Loading /></el-icon>
            <span>{{ searchLoading ? '搜索中' : '搜索' }}</span>
          </button>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="search-results-header">
            <span>搜索 "{{ lastSearchQuery }}" — {{ searchResults.length }} 个结果{{ searchCached ? ' (缓存)' : '' }}</span>
            <button class="search-close-btn" @click="clearSearch">收起</button>
          </div>
          <div
            v-for="item in searchResults" :key="item.id"
            class="search-result-item"
            :class="{ playing: streamingItem?.id === item.id, cached: hasAudioCache(item.id) }"
          >
            <div class="sr-thumb" @click="playStreaming(item)">
              <img v-if="item.thumbnail && !thumbErrors[item.id]" :src="proxyImage(item.thumbnail)" alt=""
                @error="thumbErrors[item.id] = true" />
              <el-icon v-if="!item.thumbnail || thumbErrors[item.id]" :size="20"><VideoPlay /></el-icon>
              <div class="sr-play-overlay">
                <el-icon v-if="streamingItem?.id === item.id && isPlaying" :size="18"><VideoPause /></el-icon>
                <el-icon v-else :size="18"><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="sr-info" @click="playStreaming(item)">
              <div class="sr-title">
                <span v-if="hasAudioCache(item.id)" class="sr-cached-badge" title="已缓存音频，点击直接播放">🎵 已缓存</span>
                {{ item.title }}
              </div>
              <div class="sr-meta">
                <span>{{ item.uploader || item.platform || '' }}</span>
                <span v-if="item.duration">{{ formatDuration(item.duration) }}</span>
              </div>
            </div>
            <div class="sr-actions">
              <button
                v-if="!isInLullabyList(item)"
                class="sr-save-btn"
                :disabled="savingItemId === item.id"
                title="保存到歌单"
                @click.stop="saveToSongList(item)"
              >
                <el-icon v-if="savingItemId !== item.id" :size="14"><Plus /></el-icon>
                <el-icon v-else :size="14" class="spinning"><Loading /></el-icon>
              </button>
              <span v-else class="sr-in-list-badge" title="已在歌单中">已收藏</span>
            </div>
          </div>
        </div>

        <!-- 搜索提示 -->
        <div v-if="searchHint" class="search-hint">
          <el-icon :size="13"><InfoFilled /></el-icon>
          <span>{{ searchHint }}</span>
        </div>
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
    <div class="player-panel" :class="{ active: isPlaying, visible: selectedItem || streamingItem }">
      <!-- 进度条 -->
      <div class="player-progress-bar" v-if="playerFeatures.showProgress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: ttsProgress + '%' }" :class="{ animating: isBuffering }"></div>
        </div>
      </div>

      <div class="player-inner">
        <!-- 第一行：歌名 + 类型标签 + 滚动歌词 -->
        <div class="player-left">
          <div class="player-meta">
            <div class="player-title">{{ playingItemLabel }}</div>
            <div class="player-sub">
              <span class="player-type-badge" v-if="selectedItemType === 'noise'">白噪音</span>
              <span class="player-type-badge song" v-else-if="selectedItemType === 'song'">歌曲</span>
              <span class="player-type-badge stream" v-else-if="selectedItemType === 'stream'">在线</span>
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
          <!-- 歌词：逐行横向平滑滚动（TTS / 歌曲 / 流媒体通用） -->
          <div class="player-lyrics" v-if="lyrics.length > 0 && (selectedItemType === 'stream' || selectedItemType === 'song' || selectedItemType === 'tts')" :key="'lrc-' + (streamingItem?.id || selectedItem?.id || '')" ref="lyricScrollEl">
            <span class="lyric-line" :class="{ active: currentLyricIndex === idx, past: currentLyricIndex > idx }" v-for="(l, idx) in lyrics" :key="idx">{{ l.text }}</span>
          </div>
          <div class="player-lyrics no-lyrics" v-else-if="lyricsNotFound">
            <span>暂无歌词</span>
          </div>
          <div class="player-lyrics loading" v-else-if="lyricsLoading">
            <el-icon :size="12" class="spinning"><Loading /></el-icon>
            <span>歌词加载中...</span>
          </div>
        </div>

        <!-- 第二行：所有控制按钮 -->
        <div class="player-controls">
          <!-- 上一首 / 播放暂停 / 下一首 -->
          <div class="player-nav">
            <button class="ctrl-pill" :class="{ disabled: !playerFeatures.canPrevNext }" @click="playerFeatures.canPrevNext && playPrevInList()" title="上一首">
              <el-icon :size="16"><DArrowLeft /></el-icon>
            </button>
            <button class="player-cover" :class="{ active: isPlaying, disabled: !playerFeatures.canPlay }" @click="playerFeatures.canPlay && togglePlay()">
              <el-icon :size="20"><VideoPause v-if="isPlaying && playerFeatures.canPlay" /><VideoPlay v-else /></el-icon>
            </button>
            <button class="ctrl-pill" :class="{ disabled: !playerFeatures.canPrevNext }" @click="playerFeatures.canPrevNext && playNextInList()" title="下一首">
              <el-icon :size="16"><DArrowRight /></el-icon>
            </button>
          </div>
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
              <div class="volume-drop-col">
                <el-icon :size="16" class="vol-icon" @click="setVolume(100)"><Microphone /></el-icon>
                <input type="range" class="volume-slider-drop" min="0" max="100" v-model.number="volume" @input="onVolumeChange" orient="vertical" />
                <el-icon :size="14" class="vol-icon" @click="setVolume(0)"><Mute /></el-icon>
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
import { ref, reactive, computed, onMounted, onUnmounted, markRaw, nextTick } from 'vue'
import {
  Moon, VideoPlay, VideoPause, Mute, Microphone, InfoFilled,
  Headset, Sunny, Reading, Notebook, EditPen,
  Cloudy, WindPower, Promotion, Film, Bell, Umbrella, Ship, Watch, Collection,
  Timer, ArrowDown, User, Plus, Upload, Clock, Loading, Lock, Refresh,
  Sort, Search, Close, Lightning, Pouring, Van,
  Edit, Delete
} from '@element-plus/icons-vue'

// ==================== 常量 ====================
const API_BASE = '/staticTool/api/family'
// OSS 音频基础路径（阿里云 OSS Bucket 公共读 + CDN 加速域名）
// 请替换为你的 OSS Bucket 地址，例如：https://your-bucket.oss-cn-hangzhou.aliyuncs.com/audio
const OSS_BASE_URL = ''

const noiseIconMap = {
  white: Headset, pink: Headset, brown: Headset,
  rain: Umbrella, rain_heavy: Umbrella, thunder: Lightning, ocean: Ship, stream: Pouring,
  waterfall: Pouring, fan: WindPower, vacuum: WindPower, washing: WindPower,
  campfire: Sunny, heartbeat: Timer, windchime: Bell, musicbox: Bell,
  crickets: Sunny, cat_purr: Moon, train: Van, tvstatic: Film
}

function attachNoiseIcons(items) {
  return items.map(item => ({
    ...item,
    icon: markRaw(noiseIconMap[item.type] || Headset),
    // 统一 snake_case → camelCase：后端 audio_url 映射为前端 audioUrl
    audioUrl: item.audioUrl || item.audio_url || ''
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
      { id: 'rain', label: '细雨声', color: 'sky', type: 'rain' },
      { id: 'rain_heavy', label: '大雨声', color: 'blue', type: 'rain_heavy' },
      { id: 'thunder', label: '雷雨声', color: 'indigo', type: 'thunder' },
      { id: 'ocean', label: '海浪声', color: 'teal', type: 'ocean' },
      { id: 'stream', label: '溪流声', color: 'cyan', type: 'stream' },
      { id: 'fan', label: '风扇声', color: 'green', type: 'fan' },
      { id: 'heartbeat', label: '心跳声', color: 'red', type: 'heartbeat' }
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
  if (editCategory.value === 'whitenoise') return ['white', 'pink', 'brown', 'rain', 'rain_heavy', 'thunder', 'ocean', 'stream', 'waterfall', 'fan', 'vacuum', 'washing', 'campfire', 'heartbeat', 'windchime', 'musicbox', 'crickets', 'cat_purr', 'train', 'tvstatic']
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

// ==================== 在线搜索 & 流媒体播放（哄睡神曲） ====================
const SEARCH_VIDEO_API = '/staticTool/api/video-parse/ytdlp'

/** B站等平台的图片通过后端代理，避免403防盗链 */
function proxyImage(url) {
  if (!url) return ''
  if (url.includes('hdslb.com') || url.includes('bilivideo.com')) {
    return `${SEARCH_VIDEO_API}/image-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}

// 搜索状态
const searchQuery = ref('')
const searchPlatform = ref('bilibili')
const searchLoading = ref(false)
const searchResults = ref([])
const searchCached = ref(false)
const thumbErrors = reactive({})  // 记录加载失败的缩略图
const searchHint = ref('')
const lastSearchQuery = ref('')

// 流媒体播放状态
const streamingItem = ref(null)        // 当前流媒体项 { id, title, thumbnail, uploader, duration, url }
const streamAudioEl = ref(null)        // 流媒体 Audio 元素

// 歌词状态
const lyrics = ref([])                 // [{time:秒, text:'歌词行'}] 或 [{charOffset, text}]
const currentLyricIndex = ref(-1)      // 当前高亮的歌词行索引
const lyricsLoading = ref(false)
const lyricScrollEl = ref(null)        // 歌词滚动容器
let lyricSyncTimer = null             // requestAnimationFrame ID（兼容旧逻辑）
let ttsLyricTotalChars = 0            // TTS文本总字符数，用于进度→字符坐标映射
let lyricScrollAnimId = null          // 歌词横向平滑滚动 rAF ID
let targetScrollLeft = 0              // 歌词滚动目标 scrollLeft
let lineGeom = []                     // 每一行歌词相对容器的 {left, width}
let lyricContainerW = 0               // 歌词容器可见宽度（固定渐变 + 滚动基准）
const lyricsOffset = ref(0)            // 歌词偏移（秒），正值=歌词延后，负值=歌词提前，解决LRC与流媒体不同步
const lyricsNotFound = ref(false)      // 是否未找到歌词（用于展示提示）
const savingItemId = ref(null)         // 正在保存到歌单的 item id

// 前端音频流缓存（localStorage）
// key: "audio_cache:{videoId}" → { url, expires, title, thumbnail }
const AUDIO_CACHE_KEY = 'babySleep_audioStreamCache_v1'
const AUDIO_CACHE_TTL = 25 * 60 * 1000 // 25 分钟（略小于服务端 30 分钟）
let fallbackSearchSeq = 0  // 竞态控制：快速切歌时丢弃旧请求结果

function loadAudioCache() {
  try {
    const raw = localStorage.getItem(AUDIO_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveAudioCache(cache) {
  try {
    // 清理过期条目
    const now = Date.now()
    for (const [key, val] of Object.entries(cache)) {
      if (val.expires < now) delete cache[key]
    }
    localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(cache))
  } catch { /* 忽略存储错误 */ }
}

function getCachedAudioUrl(videoId) {
  const cache = loadAudioCache()
  const entry = cache[videoId]
  if (entry && entry.expires > Date.now()) {
    return entry
  }
  if (entry) delete cache[videoId]; saveAudioCache(cache) // 过期清理
  return null
}

function setCachedAudioUrl(videoId, data) {
  const cache = loadAudioCache()
  cache[videoId] = {
    ...data,
    expires: Date.now() + AUDIO_CACHE_TTL
  }
  saveAudioCache(cache)
}

// 判断某个视频 ID 是否已有音频缓存
function hasAudioCache(videoId) {
  return !!getCachedAudioUrl(videoId)
}

// 判断搜索结果歌曲是否已在本地歌单中（用于控制 + 按钮显隐）
function isInLullabyList(item) {
  if (!lullabyItems.value.length) return false
  const t = (item.title || '').toLowerCase().trim()
  if (!t) return false
  return lullabyItems.value.some(li => {
    const lt = (li.label || '').toLowerCase().trim()
    return lt && (lt.includes(t) || t.includes(lt))
  })
}

// 根据歌曲标题查找已缓存的音频（用于点击本地歌曲时跳过搜索）
function findCachedByTitle(title) {
  if (!title) return null
  const cache = loadAudioCache()
  const lowerTitle = title.toLowerCase().trim()
  for (const [videoId, entry] of Object.entries(cache)) {
    if (entry.expires < Date.now()) continue
    const entryTitle = (entry.title || '').toLowerCase()
    if (entryTitle && (entryTitle.includes(lowerTitle) || lowerTitle.includes(entryTitle))) {
      return { videoId, ...entry }
    }
  }
  return null
}

// 搜索缓存（localStorage，TTL 30 分钟）
const SEARCH_CACHE_KEY = 'babySleep_searchCache_v1'
const SEARCH_CACHE_TTL = 30 * 60 * 1000

function getCachedSearch(key) {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY)
    const cache = raw ? JSON.parse(raw) : {}
    const entry = cache[key]
    if (entry && entry.expires > Date.now()) return entry.data
  } catch { return null }
}

function setCachedSearch(key, data) {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY)
    const cache = raw ? JSON.parse(raw) : {}
    // 限制缓存 50 条
    const keys = Object.keys(cache)
    if (keys.length >= 50) {
      keys.sort((a, b) => (cache[a].expires || 0) - (cache[b].expires || 0))
      for (let i = 0; i < Math.floor(keys.length / 2); i++) delete cache[keys[i]]
    }
    cache[key] = { data, expires: Date.now() + SEARCH_CACHE_TTL }
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache))
  } catch { /* 忽略 */ }
}

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchLoading.value = true
  searchHint.value = ''
  searchResults.value = []
  searchCached.value = false
  Object.keys(thumbErrors).forEach(k => delete thumbErrors[k])
  lastSearchQuery.value = q

  // 1. 先查前端缓存
  const cacheKey = `${searchPlatform.value}:${q}`
  const cached = getCachedSearch(cacheKey)
  if (cached) {
    searchResults.value = cached
    searchCached.value = true
    searchLoading.value = false
    return
  }

  // 2. 请求服务端搜索
  try {
    const res = await fetch(`${SEARCH_VIDEO_API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, platform: searchPlatform.value, limit: 10 })
    })
    const json = await res.json()
    if (json?.code === 0 && json.data?.results?.length > 0) {
      searchResults.value = json.data.results
      searchCached.value = !!json.cached
      // 保存到前端缓存
      setCachedSearch(cacheKey, json.data.results)
    } else if (json?.code === 0) {
      searchHint.value = `未找到 "${q}" 的相关结果，换个关键词试试`
    } else {
      searchHint.value = json?.message || '搜索失败，请重试'
    }
  } catch (err) {
    console.error('[babySleep] 搜索失败:', err)
    searchHint.value = '搜索服务不可用，请检查后端是否启动'
  } finally {
    searchLoading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  searchHint.value = ''
  searchCached.value = false
  lastSearchQuery.value = ''
  Object.keys(thumbErrors).forEach(k => delete thumbErrors[k])
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * 播放流媒体音频：先查缓存 → 再请求后端提取 → 代理播放
 */
async function playStreaming(item) {
  if (streamingItem.value?.id === item.id) {
    // 已选中该项，切换播放/暂停
    if (isPlaying.value) {
      stopStreamAudio()
      isPlaying.value = false
    } else {
      isPlaying.value = true
      streamAudioPlay()
    }
    return
  }

  // 切换到新项
  stopAllSounds()
  isPlaying.value = false
  streamingItem.value = { ...item }
  selectedItem.value = null  // 取消本地歌单项选中
  selectedItemType.value = 'stream'
  searchHint.value = ''

  const videoId = item.id
  const videoUrl = item.webpage_url || item.webpageUrl || item.url || item.original_url || ''

  // 1. 查前端音频缓存
  const cachedAudio = getCachedAudioUrl(videoId)
  if (cachedAudio && cachedAudio.url) {
    console.log('[babySleep] 命中音频缓存:', item.title)
    streamingItem.value.url = cachedAudio.url
    isPlaying.value = true
    streamAudioPlay()
    return
  }

  // 2. 请求后端提取音频流
  if (!videoUrl) {
    searchHint.value = '该搜索结果缺少播放链接，无法播放'
    return
  }

  searchHint.value = '正在提取音频流...'
  try {
    const res = await fetch(`${SEARCH_VIDEO_API}/audio-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl })
    })
    const json = await res.json()
    if (json?.code === 0 && json.data?.url) {
      streamingItem.value.url = json.data.url
      streamingItem.value.title = json.data.title || item.title
      streamingItem.value.duration = json.data.duration || item.duration
      streamingItem.value.thumbnail = json.data.thumbnail || item.thumbnail

      // 保存到前端缓存
      setCachedAudioUrl(videoId, {
        url: json.data.url,
        title: json.data.title || item.title || '',
        thumbnail: json.data.thumbnail || item.thumbnail || ''
      })

      searchHint.value = ''

      // 如果是从缓存命中的，也提示一下
      if (json.data.cached) {
        searchHint.value = ''
      }

      isPlaying.value = true
      streamAudioPlay()
    } else {
      searchHint.value = json?.message || '提取音频失败，请尝试其他来源'
    }
  } catch (err) {
    console.error('[babySleep] 提取音频流失败:', err)
    searchHint.value = '提取音频流失败，请检查后端是否启动'
  }
}

function streamAudioPlay() {
  if (!streamingItem.value?.url) return
  try {
    // 复用 Audio 元素避免浏览器自动播放策略拦截
    let audio = streamAudioEl.value
    if (!audio) {
      audio = new Audio()
      setupAudioForBackground(audio)
      audio.addEventListener('ended', () => {
        isPlaying.value = false
        if (loopMode.value === 'list') playNextInList()
        else if (loopMode.value === 'single') { streamAudioPlay() }
      })
      streamAudioEl.value = audio
    } else {
      // 暂停当前播放（如果有）
      try { audio.pause() } catch (e) {}
    }
    audio.src = streamingItem.value.url
    audio.volume = volume.value / 100
    audio.load()
    audio.play().then(() => {
      isPlaying.value = true
      setupMediaSession(streamingItem.value?.title)
      // 流媒体歌曲启动歌词同步（优先用原始歌名，提高命中率）
      const lyricTitle = streamingItem.value?.originalTitle || streamingItem.value?.title
      if (lyricTitle && lyrics.value.length === 0) {
        fetchLyrics(lyricTitle).then(() => startLyricSync())
      } else {
        startLyricSync()
      }
    }).catch(err => {
      console.error('[babySleep] 流媒体播放失败:', err)
      isPlaying.value = false
      searchHint.value = '播放失败，请重试'
    })
  } catch (e) {
    console.error('[babySleep] 流媒体播放异常:', e)
    isPlaying.value = false
  }
}

// ==================== 歌词显示 ====================

/** 解析LRC歌词格式，返回 [{time:秒, text:'歌词'}] */
function parseLRC(lrcString) {
  if (!lrcString) return []
  const lines = lrcString.split('\n')
  const result = []
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    if (matches.length === 0) continue
    const text = line.replace(timeRegex, '').trim()
    if (!text) continue
    for (const match of matches) {
      const min = parseInt(match[1]), sec = parseInt(match[2])
      let ms = 0
      if (match[3]) ms = match[3].length === 2 ? parseInt(match[3]) * 10 : parseInt(match[3])
      result.push({ time: min * 60 + sec + ms / 1000, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

/** 将TTS文本拆为歌词行，按句子分割，附带累计字符数用于进度映射 */
function textToLyricLines(text) {
  if (!text) return []
  // 按句子分隔符拆分，保留分隔符
  const sentences = text.split(/(?<=[。！？；\n])/)
  const lines = []
  let charCount = 0
  for (const s of sentences) {
    const trimmed = s.trim()
    if (!trimmed) continue
    lines.push({ charOffset: charCount, text: trimmed })
    charCount += trimmed.length
  }
  return { lines, totalChars: charCount }
}

/** 根据歌名拉取LRC歌词 */
async function fetchLyrics(title) {
  if (!title) return
  lyricsLoading.value = true
  lyrics.value = []
  currentLyricIndex.value = -1
  lyricsNotFound.value = false
  lyricsOffset.value = 0  // 切歌时重置偏移
  try {
    const res = await fetch(`${SEARCH_VIDEO_API}/lyrics?title=${encodeURIComponent(title)}`)
    const data = await res.json()
    if (data?.code === 0 && data?.data?.syncedLyrics) {
      lyrics.value = parseLRC(data.data.syncedLyrics)
      lyricsNotFound.value = false
    } else {
      lyricsNotFound.value = true
    }
  } catch (e) {
    console.error('[babySleep] 歌词拉取失败:', e.message)
    lyricsNotFound.value = true
  } finally {
    lyricsLoading.value = false
  }
}

/** 启动歌词时间同步（委托给统一的平滑滚动 + 固定渐变循环） */
function startLyricSync() {
  stopLyricSync()
  startSmoothLyricScroll()
  nextTick(measureLyricGeom)  // 渲染后测量每行位置
}

function stopLyricSync() {
  if (lyricSyncTimer) { cancelAnimationFrame(lyricSyncTimer); lyricSyncTimer = null }
}

/** 当前正在播放的音频元素（歌曲用 songAudio，流媒体用 streamAudioEl） */
function activeAudioEl() {
  if (selectedItemType.value === 'song') return songAudio
  if (selectedItemType.value === 'stream') return streamAudioEl.value
  if (selectedItemType.value === 'noise') return noiseAudio
  return null
}

/** 测量每行歌词相对容器的几何位置，并设置固定渐变所需的容器宽度变量 */
function measureLyricGeom() {
  const c = lyricScrollEl.value
  if (!c) return
  lyricContainerW = c.clientWidth
  c.style.setProperty('--lw', lyricContainerW + 'px')
  const spans = c.querySelectorAll('.lyric-line')
  lineGeom = Array.from(spans).map(el => ({ left: el.offsetLeft, width: el.offsetWidth }))
}

/** 根据当前播放进度，算出“当前读到位置”在歌词条中的 x 坐标（连续、平滑） */
function computeCursorX() {
  const lines = lyrics.value
  if (!lines.length || !lyricContainerW) return 0
  if (selectedItemType.value === 'tts') {
    const total = ttsLyricTotalChars || 0
    if (total <= 0) return 0
    const read = (ttsProgress.value / 100) * total
    let li = 0
    for (let k = lines.length - 1; k >= 0; k--) {
      if (read >= (lines[k].charOffset || 0)) { li = k; break }
    }
    const startC = lines[li].charOffset || 0
    const endC = (li + 1 < lines.length ? (lines[li + 1].charOffset || 0) : total)
    const frac = endC > startC ? (read - startC) / (endC - startC) : 0
    const g = lineGeom[li]
    return g ? g.left + frac * g.width : 0
  } else {
    const audio = activeAudioEl()
    if (!audio) return 0
    const t = audio.currentTime + lyricsOffset.value  // 应用用户手动偏移
    let li = 0
    for (let k = lines.length - 1; k >= 0; k--) {
      if ((lines[k].time || 0) <= t) { li = k; break }
    }
    const t0 = lines[li].time || 0
    const t1 = (li + 1 < lines.length ? (lines[li + 1].time || 0) : (audio.duration || t))
    const frac = t1 > t0 ? (t - t0) / (t1 - t0) : 0
    const g = lineGeom[li]
    return g ? g.left + frac * g.width : 0
  }
}

/** 启动歌词横向平滑滚动 + 固定渐变（单一 rAF 循环，匀速跟随阅读，无跳变） */
function startSmoothLyricScroll() {
  stopSmoothLyricScroll()
  measureLyricGeom()  // 先测一次（DOM 未更新时用旧值，nextTick 会再校正）
  function animate() {
    const c = lyricScrollEl.value
    if (!c) { lyricScrollAnimId = requestAnimationFrame(animate); return }
    const lines = lyrics.value
    // 1) 计算当前阅读位置对应的高亮行与滚动目标
    if (lines.length && lyricContainerW) {
      let li = 0
      if (selectedItemType.value === 'tts') {
        const total = ttsLyricTotalChars || 0
        const read = (ttsProgress.value / 100) * total
        for (let k = lines.length - 1; k >= 0; k--) {
          if (read >= (lines[k].charOffset || 0)) { li = k; break }
        }
      } else {
        const a = activeAudioEl()
        if (a) {
          const t = a.currentTime + lyricsOffset.value  // 应用用户手动偏移
          for (let k = lines.length - 1; k >= 0; k--) {
            if ((lines[k].time || 0) <= t) { li = k; break }
          }
        }
      }
      currentLyricIndex.value = li
      const cursorX = computeCursorX()
      // 让“读到位置”稳定在容器左侧 ~22% 处，匀速跟随阅读
      targetScrollLeft = Math.max(0, cursorX - lyricContainerW * 0.22)
    }
    // 2) 平滑插值滚动（指数缓动，无跳变）
    const cur = c.scrollLeft
    const d = targetScrollLeft - cur
    c.scrollLeft = Math.abs(d) < 0.3 ? targetScrollLeft : cur + d * 0.1
    // 3) 固定渐变：把每行渐变锚定到“可见窗口”，实现盒子左→右渐变
    const S = c.scrollLeft
    const spans = c.querySelectorAll('.lyric-line')
    for (let i = 0; i < spans.length; i++) {
      spans[i].style.backgroundPositionX = (S - spans[i].offsetLeft) + 'px'
    }
    lyricScrollAnimId = requestAnimationFrame(animate)
  }
  lyricScrollAnimId = requestAnimationFrame(animate)
}
function stopSmoothLyricScroll() {
  if (lyricScrollAnimId) { cancelAnimationFrame(lyricScrollAnimId); lyricScrollAnimId = null }
}

/**
 * @param {boolean} destroy 是否彻底销毁（切换模式时传 true，列表内切歌传 false）
 */
function stopStreamAudio(destroy = false) {
  if (streamAudioEl.value) {
    try { streamAudioEl.value.pause() } catch (e) {}
    if (destroy) {
      try { streamAudioEl.value.src = '' } catch (e) {}
      streamAudioEl.value = null
    }
  }
  if (destroy) {
    stopLyricSync()
    lyrics.value = []
    currentLyricIndex.value = -1
  }
}

/**
 * 将搜索到的在线歌曲保存到本地歌单
 */
async function saveToSongList(item) {
  savingItemId.value = item.id
  try {
    const body = {
      title: item.title || '未命名歌曲',
      content: `线上来源：${item.uploader || item.platform || '未知'} · 时长：${formatDuration(item.duration) || '未知'}`,
      artist: item.uploader || '',
      type: '轻音乐',
      audio_url: item.webpage_url || item.url || '',
      category: 'lullaby'
    }
    const res = await fetch(`${API_BASE}/sleep-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (json.success) {
      // 刷新歌单
      await fetchSleepContent()
      searchHint.value = `"${item.title}" 已保存到歌单`
      // 3秒后清除提示
      setTimeout(() => { if (searchHint.value === `"${item.title}" 已保存到歌单`) searchHint.value = '' }, 3000)
    } else {
      searchHint.value = json.error || '保存失败'
    }
  } catch (e) {
    console.error('[babySleep] 保存到歌单失败:', e)
    searchHint.value = '保存失败，网络错误'
  } finally {
    savingItemId.value = null
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
const selectedVoice = ref('zh-CN-YunjianNeural')  // Edge TTS 默认音色：云健
const customVoiceId = ref(null)
const ttsAvailable = ref(true)  // Edge TTS 始终免费可用
const cloneAvailable = ref(false)
const cloneNeedPassword = ref(false)

const currentVoiceLabel = computed(() => {
  if (customVoiceId.value) {
    const cv = customVoices.value.find(v => v.id === customVoiceId.value)
    return cv ? cv.label : '云健'
  }
  const pv = presetVoices.value.find(v => v.id === selectedVoice.value)
  return pv ? pv.label : '云健'
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
let wasPlayingBeforeHidden = false  // 页面隐藏前是否正在播放，用于回到前台自动恢复
const ttsProgress = ref(0)
const volume = ref(50)

// ==================== 深色模式（晚上8点 ~ 早上7点自动切换） ====================
const isDarkMode = ref(false)
let darkModeTimer = null

/** 根据当前时间判断是否应该开启深色模式 */
function checkDarkMode() {
  const hour = new Date().getHours()
  const shouldDark = hour >= 20 || hour < 7
  if (isDarkMode.value !== shouldDark) {
    isDarkMode.value = shouldDark
  }
}
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
  const isStream = type === 'stream'
  // 有音频的歌曲/流媒体：基础播放能力（无进度条/倍速/音色）；无音频的歌曲：完全不可用
  return {
    canPlay: isNoise || isTts || hasSongAudio || isStream,
    canLoop: isNoise || isTts || hasSongAudio || isStream,
    canVolume: isNoise || isTts || hasSongAudio || isStream,
    canSpeed: isTts,
    canVoice: isTts,
    canTimer: isNoise || isTts || hasSongAudio || isStream,
    canPrevNext: isTts || isNoise || isStream || (isSong && getPlayableList().length > 1),
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

/** 获取当前播放列表（兼容本地歌曲/TTS/白噪音 + 搜索结果流媒体） */
function getPlayableList() {
  const type = selectedItemType.value
  if (type === 'stream') return searchResults.value
  return currentItemList.value
}

/** 播放列表中的下一首 */
function playNextInList() {
  const list = getPlayableList()
  if (!list.length) return
  const type = selectedItemType.value
  const currentId = type === 'stream'
    ? streamingItem.value?.id
    : selectedItem.value?.id
  const idx = list.findIndex(item => item.id === currentId)
  const nextIdx = idx < 0 || idx >= list.length - 1 ? 0 : idx + 1
  const nextItem = list[nextIdx]
  if (type === 'stream') {
    playStreaming(nextItem)
  } else {
    selectedItem.value = nextItem
    stopAllSounds()
    startPlayback()
  }
}

/** 播放列表中的上一首 */
function playPrevInList() {
  const list = getPlayableList()
  if (!list.length) return
  const type = selectedItemType.value
  const currentId = type === 'stream'
    ? streamingItem.value?.id
    : selectedItem.value?.id
  const idx = list.findIndex(item => item.id === currentId)
  const prevIdx = idx <= 0 ? list.length - 1 : idx - 1
  const prevItem = list[prevIdx]
  if (type === 'stream') {
    playStreaming(prevItem)
  } else {
    selectedItem.value = prevItem
    stopAllSounds()
    startPlayback()
  }
}

const playingItemLabel = computed(() => {
  if (selectedItemType.value === 'stream' && streamingItem.value) {
    return streamingItem.value.title || '在线播放'
  }
  return selectedItem.value?.label || '未选择'
})

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
let noiseAudio = null // 白噪音真实音频播放器（OSS 音频文件）
let activeNodes = []
let bgAudioEl = null           // 后台播放 Audio 元素（接收 Web Audio 输出）
let mediaStreamDest = null     // AudioContext → MediaStream 桥梁

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
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    // 监听状态变化：当 AudioContext 被系统挂起时自动恢复
    audioCtx.onstatechange = () => {
      if (audioCtx && audioCtx.state === 'suspended' && isPlaying.value) {
        audioCtx.resume().then(() => {
          // 恢复后确保后台 Audio 元素仍在播放
          if (bgAudioEl && bgAudioEl.paused) {
            bgAudioEl.play().catch(() => {})
          }
        }).catch(() => {})
      }
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

/** 进度条追踪（含TTS歌词同步） */
function startProgressTracking(ctx, source, duration) {
  clearProgress()
  currentLyricIndex.value = -1
  const startTime = ctx.currentTime
  const update = () => {
    if (!isPlaying.value) { clearProgress(); return }
    const elapsed = ctx.currentTime - startTime
    ttsProgress.value = Math.min((elapsed / (duration / source.playbackRate.value)) * 100, 99)
    // 歌词高亮/滚动由统一循环（startSmoothLyricScroll）根据 ttsProgress 处理
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
  stopNoiseAudio()
  stopStreamAudio(true)
  clearProgress()
  isBuffering.value = false
  ttsRequestId++  // 取消所有进行中的异步 TTS 请求
  activeNodes.forEach(n => {
    try { n.stop?.() } catch (e) {}
    try { n.disconnect() } catch (e) {}
  })
  activeNodes = []
  // 暂停后台音频桥梁（但不销毁，下次播放时自动恢复）
  if (bgAudioEl) {
    try { bgAudioEl.pause() } catch (e) {}
  }
  stopSmoothLyricScroll()
}

// ---- 后台播放 ----

/** 给 Audio 元素加上移动端后台播放所需属性 */
function setupAudioForBackground(audio) {
  if (!audio) return
  audio.setAttribute('playsinline', '')
  audio.setAttribute('webkit-playsinline', '')
  audio.setAttribute('x5-playsinline', '')       // 微信 X5 内核
  audio.setAttribute('x5-video-player-type', 'h5')
  audio.setAttribute('x5-video-player-fullscreen', 'true')
  audio.setAttribute('x5-video-orientation', 'portraint')
}

/**
 * 创建/获取后台音频输出桥梁：将 Web Audio API（AudioContext）的输出
 * 路由到一个 HTMLAudioElement，从而获得后台/锁屏播放能力。
 * 这是让白噪音、TTS 哄睡故事等 AudioContext 音源在 Mate80 等手机上
 * 锁屏后继续播放的关键。
 * @returns {{ audioEl: HTMLAudioElement, dest: MediaStreamAudioDestinationNode }}
 */
function ensureBgAudioOutput() {
  if (!bgAudioEl) {
    const ctx = getAudioContext()
    mediaStreamDest = ctx.createMediaStreamDestination()
    bgAudioEl = new Audio()
    bgAudioEl.srcObject = mediaStreamDest.stream
    setupAudioForBackground(bgAudioEl)
    // 静音循环，让浏览器认为该页面正在"播放音频"，防止 AudioContext 被挂起
    bgAudioEl.loop = true
  }
  // 确保 Audio 元素处于播放状态（即使当前没有音源输出，静默流也能保持音频会话活跃）
  if (bgAudioEl.paused) {
    bgAudioEl.play().catch(() => {})
  }
  return { audioEl: bgAudioEl, dest: mediaStreamDest }
}

/** 页面可见性变化：隐藏时记录播放状态，恢复可见时自动继续播放 */
function handleVisibilityChange() {
  if (document.hidden) {
    wasPlayingBeforeHidden = isPlaying.value
  } else {
    // 恢复 AudioContext（白噪音、TTS 等 Web Audio 类型）
    if (wasPlayingBeforeHidden && !isPlaying.value) {
      const type = selectedItemType.value
      // 对于 HTMLAudioElement 类型（歌曲/流媒体/OSS白噪音）
      if (type === 'song' || type === 'stream' || (type === 'noise' && noiseAudio)) {
        const a = activeAudioEl()
        if (a && a.paused) {
          a.play().then(() => { isPlaying.value = true }).catch(() => {})
        }
      }
      // 对于 AudioContext 合成类型（白噪音合成/TTS）：恢复 AudioContext 并重新播放
      if ((type === 'noise' && !noiseAudio) || type === 'tts') {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().then(() => {
            // 确保后台音频元素仍在播放
            if (bgAudioEl && bgAudioEl.paused) {
              bgAudioEl.play().catch(() => {})
            }
            isPlaying.value = true
          }).catch(() => {})
        } else {
          isPlaying.value = true
        }
      }
    }
    wasPlayingBeforeHidden = false
  }
}

/** 注册 Media Session API，让系统锁屏/控制中心知道有音频，有助于后台播放 */
function setupMediaSession(title) {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || '哄睡音乐',
      artist: '宝宝睡前故事',
      album: 'Baby Sleep'
    })
    navigator.mediaSession.setActionHandler('play', () => togglePlay())
    navigator.mediaSession.setActionHandler('pause', () => togglePlay())
    navigator.mediaSession.setActionHandler('stop', () => stopAllSounds())
  } catch (e) { /* 静默 */ }
}

// ---- 歌曲音频播放 ----
function playSongAudio(url, title) {
  stopSongAudio()
  if (!url || (!url.startsWith('http') && !url.startsWith('/'))) {
    console.warn('[babySleep] 无效的音频地址，跳过播放:', url)
    isPlaying.value = false
    fallbackToStreaming(title)
    return
  }
  try {
    songAudio = new Audio(url)
    setupAudioForBackground(songAudio)
    songAudio.volume = volume.value / 100
    songAudio.play().then(() => {
      isPlaying.value = true
      setupMediaSession(title)
    }).catch(async (err) => {
      console.warn('[babySleep] 歌曲直接播放失败，尝试在线搜索:', title)
      isPlaying.value = false
      songAudio = null
      await fallbackToStreaming(title)
    })
    songAudio.addEventListener('ended', () => {
      isPlaying.value = false
      songAudio = null
      // 列表循环
      if (loopMode.value === 'list') playNextInList()
      else if (loopMode.value === 'single') { songAudio = new Audio(url); setupAudioForBackground(songAudio); songAudio.volume = volume.value / 100; songAudio.play() }
    })
  } catch (e) {
    console.error('[babySleep] 歌曲播放异常:', e)
    isPlaying.value = false
  }
}

// 播放失败时自动通过 yt-dlp 在线搜索 → 流媒体播放
async function fallbackToStreaming(title) {
  if (!title) return

  const cachedEntry = findCachedByTitle(title)
  const searchSeq = ++fallbackSearchSeq  // 递增序号，防止旧请求覆盖新展示

  // 有缓存：先行播放，不等待搜索
  if (cachedEntry) {
    stopAllSounds()
    isPlaying.value = false
    streamingItem.value = {
      id: cachedEntry.videoId,
      title: cachedEntry.title || title,
      url: cachedEntry.url,
      thumbnail: cachedEntry.thumbnail || '',
      originalTitle: title  // 原始歌名，用于精确歌词搜索
    }
    selectedItem.value = null
    selectedItemType.value = 'stream'
    searchHint.value = `已缓存 — 正在获取在线结果...`
    isPlaying.value = true
    streamAudioPlay()
  }

  // 无论有无缓存，都发起搜索展示结果
  searchLoading.value = true
  if (!cachedEntry) {
    searchHint.value = `正在在线搜索 "${title}"...`
  }

  try {
    const res = await fetch(`${SEARCH_VIDEO_API}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: title, platform: 'bilibili', limit: 5 })
    })
    // 竞态保护：如果不是最新的搜索请求，丢弃结果
    if (searchSeq !== fallbackSearchSeq) return
    const json = await res.json()
    if (json?.code === 0 && json.data?.results?.length > 0) {
      if (searchSeq !== fallbackSearchSeq) return  // 再次检查，防止切歌
      searchResults.value = json.data.results
      searchHint.value = ''
      if (!cachedEntry) {
        const best = { ...json.data.results[0], originalTitle: title }  // 注入原始歌名用于歌词搜索
        await playStreaming(best)
      }
    } else {
      if (searchSeq !== fallbackSearchSeq) return
      searchHint.value = cachedEntry ? '' : `未找到 "${title}" 的在线版本，请尝试其他歌曲`
    }
  } catch (err) {
    if (searchSeq !== fallbackSearchSeq) return
    console.error('[babySleep] 在线搜索失败:', err)
    if (!cachedEntry) searchHint.value = '搜索服务不可用，请检查后端是否启动'
  } finally {
    if (searchSeq === fallbackSearchSeq) searchLoading.value = false
  }
}

function stopSongAudio() {
  if (songAudio) {
    try { songAudio.pause() } catch (e) {}
    songAudio = null
  }
}

function stopNoiseAudio() {
  if (noiseAudio) {
    try { noiseAudio.pause() } catch (e) {}
    noiseAudio = null
  }
}

/** 播放真实白噪音音频文件（OSS CDN） — 循环播放，支持后台/锁屏 */
function playNoiseAudio(url, label) {
  stopAllSounds()
  if (!url) return
  try {
    noiseAudio = new Audio(url)
    noiseAudio.loop = true
    setupAudioForBackground(noiseAudio)
    noiseAudio.volume = volume.value / 100
    noiseAudio.play().then(() => {
      isPlaying.value = true
      setupMediaSession(label || '白噪音')
    }).catch(err => {
      console.warn('[babySleep] OSS 音频播放失败，回退到 Web Audio 合成:', err)
      noiseAudio = null
      // 用 type 字符串调用 → 跳过 audioUrl 检查，直接走合成
      if (selectedItem.value) createNoise(selectedItem.value.type)
    })
  } catch (e) {
    console.error('[babySleep] 白噪音音频播放异常:', e)
    noiseAudio = null
    if (selectedItem.value) createNoise(selectedItem.value.type)
  }
}

// ---- 白噪音生成（高音质版） ----
const NOISE_BUF_SEC = 30  // 30 秒长缓冲，循环感大幅降低

/** Voss-McCartney 粉红噪音算法（每八度 +1 个白噪音源，产生真正的 1/f 频谱） */
function vossPinkNoise(ctx, len) {
  const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0)
  const octaves = 7; const rolls = new Float64Array(octaves)
  for (let i = 0; i < len; i++) {
    let sum = 0; let mask = 1
    for (let o = 0; o < octaves; o++) {
      if ((i & mask) === 0) rolls[o] = Math.random() * 2 - 1
      sum += rolls[o]; mask <<= 1
    }
    d[i] = sum / octaves * 0.5
  }
  return buf
}

/** 布朗/棕色噪音（随机游走 + 低频约束） */
function brownNoiseBuf(ctx, len) {
  const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0)
  let lo = 0
  for (let i = 0; i < len; i++) {
    lo += (Math.random() * 2 - 1) * 0.08
    if (lo > 1.2) lo = 1.2; if (lo < -1.2) lo = -1.2
    d[i] = lo * 0.7
  }
  return buf
}

/** 高质量雨声 —— 多层雨滴（大/中/小），自然随机的密度和强度变化 */
function rainBuffer(ctx, heavy) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  // 大滴/中滴/细滴 三层
  const baseProb = heavy ? 0.02 : 0.008
  const baseAmp = heavy ? 0.7 : 0.4
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.02
    // 细密背景雨声（持续白噪声 + 低通）
    s += (Math.random() * 2 - 1) * 0.06
    // 中雨滴（随机间隔）
    if (Math.random() < baseProb) {
      s += (Math.random() * 2 - 1) * baseAmp * 0.7
    }
    // 大雨滴（稀疏但有冲击感）
    if (Math.random() < baseProb * 0.25) {
      const burst = Math.sin(Math.random() * Math.PI * 2) * 0.8 + (Math.random() * 2 - 1) * 0.5
      s += burst * baseAmp * 1.2
    }
    d[i] = Math.max(-1, Math.min(1, s * 0.7))
  }
  return buf
}

/** 高质量海浪 —— 多层正弦调制 + 背景噪声，自然潮汐感 */
function oceanBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    // 主波浪包络（低频 0.08-0.15Hz 变化）
    const env1 = Math.sin(t * 0.12 * Math.PI * 2) * 0.5 + 0.5
    const env2 = Math.sin(t * 0.17 * Math.PI * 2 + 1.5) * 0.3 + 0.7
    const env = env1 * 0.6 + env2 * 0.4
    // 泡沫高频 + 低频涌动
    const foam = (Math.random() * 2 - 1) * 0.35
    const swell = Math.sin(t * 1.8 * Math.PI * 2) * 0.1
    d[i] = ((Math.random() * 2 - 1) * 0.45 * env + swell + foam * env * 0.6) * 0.65
  }
  return buf
}

/** 溪流 —— 湍流 + 飞溅 + 低频水流声 */
function streamBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    let s = (Math.random() * 2 - 1) * 0.1
    // 水滴飞溅
    if (Math.random() < 0.06) s += (Math.random() * 2 - 1) * 0.35
    // 湍流低频调制
    s += Math.sin(t * 2.5 * Math.PI * 2 + Math.sin(t * 0.4) * 3) * 0.06
    // 流水持续声
    s += Math.sin(t * 6.3 * Math.PI * 2) * 0.03
    d[i] = s * 0.8
  }
  return buf
}

/** 瀑布 —— 持续强大的水流轰鸣 + 水雾飞溅 */
function waterfallBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    let s = (Math.random() * 2 - 1) * 0.35  // 强大持续轰鸣
    s += Math.sin(t * 40 * Math.PI * 2 + Math.random() * 2) * 0.05
    if (Math.random() < 0.15) s += (Math.random() * 2 - 1) * 0.3  // 水雾飞溅
    s += Math.sin(t * 0.6 * Math.PI * 2) * 0.08  // 低频起伏
    d[i] = s * 0.5
  }
  return buf
}

/** 风扇 —— 电机低频嗡鸣 + 叶片切风声 */
function fanBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    // 电机基频 + 谐波
    let s = Math.sin(120 * Math.PI * t) * 0.22
    s += Math.sin(180 * Math.PI * t) * 0.08
    s += Math.sin(240 * Math.PI * t) * 0.04
    // 宽频气流声
    s += (Math.random() * 2 - 1) * 0.12
    // 微小速度波动
    const wobble = 1 + Math.sin(t * 0.3) * 0.05
    d[i] = s * wobble * 0.8
  }
  return buf
}

/** 吸尘器 —— 强低频轰鸣 + 高频电机声 */
function vacuumBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    let s = Math.sin(150 * Math.PI * t) * 0.25
    s += Math.sin(300 * Math.PI * t) * 0.12
    s += Math.sin(450 * Math.PI * t) * 0.06
    s += (Math.random() * 2 - 1) * 0.2
    d[i] = s * 0.65
  }
  return buf
}

/** 洗衣机 —— 低频旋转嗡鸣 + 水声 + 周期节奏 */
function washingBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    const cycle = (t % 3) / 3  // 3秒循环周期
    let s = Math.sin(80 * Math.PI * t) * 0.15
    s += Math.sin(160 * Math.PI * t) * 0.06
    s += (Math.random() * 2 - 1) * 0.15
    // 旋转节奏
    s += Math.sin(cycle * 8 * Math.PI * 2) * 0.08 * Math.sin(t * 0.5 * Math.PI)
    // 间歇水声
    if (cycle < 0.3) s += (Math.random() * 2 - 1) * 0.25
    d[i] = s * 0.7
  }
  return buf
}

/** 高质量篝火 —— 多层爆裂 + 持续背景燃烧 */
function campfireBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    let s = (Math.random() * 2 - 1) * 0.06  // 背景燃烧
    // 随机爆裂声（多种强度）
    const r = Math.random()
    if (r < 0.005) {
      const burst = Math.exp(-((i % 200) / 80)) * (Math.random() * 2 - 1) * 0.8
      s += burst
    } else if (r < 0.02) {
      const burst = Math.exp(-((i % 150) / 60)) * (Math.random() * 2 - 1) * 0.4
      s += burst
    }
    // 微风摇曳火焰
    s += Math.sin(t * 2.5 * Math.PI * 2 + Math.sin(t * 0.3) * 2) * 0.03
    d[i] = Math.max(-1, Math.min(1, s * 0.7))
  }
  return buf
}

/** 心跳 —— 更真实的双脉冲（lub-dub） */
function heartbeatBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const bpm = 65; const beatLen = Math.floor(sr * 60 / bpm)
  const gap = Math.floor(beatLen * 0.18)  // lub-dub 间距
  for (let b = 0; b * beatLen < len; b++) {
    const start1 = b * beatLen
    const start2 = start1 + gap
    ;[start1, start2].forEach((s0, idx) => {
      const amp = idx === 0 ? 0.7 : 0.55
      for (let j = 0; j < Math.floor(gap * 0.6) && s0 + j < len; j++) {
        d[s0 + j] += Math.sin(30 * Math.PI * (j / sr)) * Math.exp(-j / (sr * 0.06)) * amp
        d[s0 + j] += Math.sin(55 * Math.PI * (j / sr)) * Math.exp(-j / (sr * 0.03)) * amp * 0.3
      }
    })
  }
  for (let i = 0; i < len; i++) d[i] = Math.max(-1, Math.min(1, d[i] * 0.8))
  return buf
}

/** 高质量风铃 —— 随机音符 + 自然衰减 + 微风背景 */
function windchimeBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319]
  const chimeGap = sr * 1.2  // 平均 1.2 秒一次
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.01
    const chimeIdx = Math.floor(i / chimeGap)
    if (chimeIdx < 50) {
      const noteFreq = notes[Math.floor(Math.random() * notes.length)]
      const tInNote = (i % Math.floor(chimeGap * (0.5 + Math.random() * 0.5))) / sr
      s += Math.sin(2 * Math.PI * noteFreq * tInNote) * Math.exp(-tInNote * 2.5) * 0.25
      // 泛音
      s += Math.sin(2 * Math.PI * noteFreq * 2 * tInNote) * Math.exp(-tInNote * 4) * 0.08
    }
    d[i] = s
  }
  return buf
}

/** 八音盒 —— 轻柔旋律碎片 + 机械齿轮质感 */
function musicboxBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  // 摇篮曲风格音阶
  const melody = [523, 587, 659, 784, 880, 784, 659, 587,
                 523, 659, 784, 880, 1047, 880, 784, 659]
  const noteDur = sr * 0.7
  for (let n = 0; n < melody.length && n * noteDur < len; n++) {
    const freq = melody[n]
    const start = n * noteDur
    for (let j = 0; j < noteDur && start + j < len; j++) {
      const tIn = j / sr
      const env = Math.exp(-tIn * 2.0)
      let s = Math.sin(2 * Math.PI * freq * tIn) * env * 0.18
      s += Math.sin(2 * Math.PI * freq * 2 * tIn) * env * 0.05
      s += Math.sin(2 * Math.PI * freq * 3 * tIn) * env * 0.02
      // 齿轮质感
      s += (Math.random() * 2 - 1) * 0.008 * env
      d[start + j] += s
    }
  }
  return buf
}

/** 蟋蟀声 —— 高频颤音 + 夜间环境 */
function cricketsBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const chirpFreq = 4500
  let chirpPhase = 0; let chirping = false; let chirpRemain = 0
  let chirpCount = 0
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.008  // 夜间静默背景
    if (chirpRemain > 0) {
      chirping = true; chirpRemain--; chirpPhase += chirpFreq * (1 + 0.05 * Math.sin(i * 0.003)) / sr
      s += Math.sin(chirpPhase * Math.PI * 2) * 0.18 * Math.sin((chirpCount % 15) * Math.PI / 15)
    } else {
      chirping = false
      // 随机开始下一串
      chirpCount++
      if (Math.random() < (chirpCount > 3 ? 0.015 : 0.3)) {
        chirpRemain = Math.floor(sr * (0.08 + Math.random() * 0.12))
        chirpPhase = Math.random() * 2 * Math.PI
      }
    }
    d[i] = s * 0.7
  }
  return buf
}

/** 猫咪呼噜 —— 低频震颤（约25Hz基频 + 谐波） */
function catPurrBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / sr
    // 呼噜基频 25Hz + 震颤波动
    const wobble = 1 + 0.15 * Math.sin(t * 3 * Math.PI * 2) + 0.1 * Math.sin(t * 0.7 * Math.PI * 2)
    let s = Math.sin(25 * Math.PI * 2 * t) * 0.3 * wobble
    s += Math.sin(50 * Math.PI * 2 * t) * 0.12 * wobble
    s += Math.sin(75 * Math.PI * 2 * t) * 0.06 * wobble
    // 轻微呼吸感
    s += Math.sin(t * 1.2 * Math.PI * 2) * 0.04
    d[i] = s * 0.8
  }
  return buf
}

/** 火车声 —— 轮轨节奏 + 低频轰鸣 + 汽笛 */
function trainBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  const clickFreq = 2.8  // 每秒 2.8 次铁轨撞击
  for (let i = 0; i < len; i++) {
    const t = i / sr
    let s = (Math.random() * 2 - 1) * 0.05  // 背景轰隆
    s += Math.sin(60 * Math.PI * t) * 0.1  // 低频引擎
    // 铁轨节奏
    const phase = (t * clickFreq) % 1
    if (phase < 0.12) {
      const clickEnv = Math.sin(phase / 0.12 * Math.PI)
      s += (Math.random() * 2 - 1) * 0.3 * clickEnv
      s += Math.sin(200 * Math.PI * t) * 0.08 * clickEnv
    }
    // 偶尔汽笛
    if ((Math.floor(t / 12) % 3) === 0 && (t % 12) < 2) {
      s += Math.sin(800 * Math.PI * t) * 0.06 * Math.sin((t % 2) * Math.PI / 2)
    }
    d[i] = s * 0.65
  }
  return buf
}

/** 雨声增强版（大雨） */
function rainHeavyBuffer(ctx) {
  const sr = ctx.sampleRate; const len = sr * NOISE_BUF_SEC
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    let s = (Math.random() * 2 - 1) * 0.15
    if (Math.random() < 0.04) s += (Math.random() * 2 - 1) * 0.7
    if (Math.random() < 0.012) s += (Math.random() * 2 - 1) * 0.9
    d[i] = Math.max(-1, Math.min(1, s * 0.6))
  }
  return buf
}

/** 创建噪音音频 */
function createNoise(noiseItem) {
  const type = noiseItem?.type || noiseItem
  // 优先使用 OSS 真实音频文件；没有 audioUrl 则回退到 Web Audio 合成
  const audioUrl = noiseItem?.audioUrl
  if (audioUrl && OSS_BASE_URL) {
    const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${OSS_BASE_URL}/${audioUrl.replace(/^\//, '')}`
    playNoiseAudio(fullUrl, noiseItem?.label || type)
    return
  }

  stopAllSounds()
  const ctx = getAudioContext(); const sr = ctx.sampleRate; let buf
  const bufLen = sr * NOISE_BUF_SEC
  // 启用后台音频桥梁：将 AudioContext 输出路由到支持后台播放的 HTMLAudioElement
  const { dest } = ensureBgAudioOutput()

  switch (type) {
    case 'white': { buf = ctx.createBuffer(1, bufLen, sr); const d = buf.getChannelData(0); for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.5; break }
    case 'pink': buf = vossPinkNoise(ctx, bufLen); break
    case 'brown': buf = brownNoiseBuf(ctx, bufLen); break
    case 'rain': buf = rainBuffer(ctx, false); break
    case 'rain_heavy': buf = rainHeavyBuffer(ctx); break
    case 'thunder': buf = rainBuffer(ctx, true); break  // 雷雨 → 大雨算法 + 低频滤波
    case 'ocean': buf = oceanBuffer(ctx); break
    case 'stream': buf = streamBuffer(ctx); break
    case 'waterfall': buf = waterfallBuffer(ctx); break
    case 'fan': buf = fanBuffer(ctx); break
    case 'vacuum': buf = vacuumBuffer(ctx); break
    case 'washing': buf = washingBuffer(ctx); break
    case 'campfire': buf = campfireBuffer(ctx); break
    case 'heartbeat': buf = heartbeatBuffer(ctx); break
    case 'windchime': buf = windchimeBuffer(ctx); break
    case 'musicbox': buf = musicboxBuffer(ctx); break
    case 'crickets': buf = cricketsBuffer(ctx); break
    case 'cat_purr': buf = catPurrBuffer(ctx); break
    case 'train': buf = trainBuffer(ctx); break
    case 'tvstatic': { buf = ctx.createBuffer(1, bufLen, sr); const d = buf.getChannelData(0); for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.6; break }
    default: { buf = ctx.createBuffer(1, bufLen, sr); const d = buf.getChannelData(0); for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.5; break }
  }

  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true

  // 高质量滤波链路
  const gain = ctx.createGain(); gain.gain.value = volume.value / 100 * 0.5
  let prev = src
  const addFilter = (type, freq, Q) => {
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq
    if (Q) f.Q.value = Q
    prev.connect(f); prev = f
  }
  switch (type) {
    case 'rain': addFilter('highpass', 1500); break
    case 'rain_heavy': addFilter('highpass', 800); break
    case 'thunder': addFilter('lowpass', 1200); addFilter('highpass', 60); break
    case 'ocean': addFilter('lowpass', 700); break
    case 'stream': addFilter('highpass', 600); addFilter('lowpass', 8000); break
    case 'waterfall': addFilter('lowpass', 5000); addFilter('highpass', 100); break
    case 'fan': addFilter('lowpass', 800); break
    case 'vacuum': addFilter('lowpass', 2000); addFilter('highpass', 60); break
    case 'washing': addFilter('lowpass', 1500); break
    case 'tvstatic': addFilter('bandpass', 3000, 0.5); break
    case 'cat_purr': addFilter('lowpass', 300); break
    case 'train': addFilter('lowpass', 1200); break
    case 'crickets': addFilter('highpass', 2000); break
    case 'campfire': addFilter('highpass', 200); break
    default: break
  }
  prev.connect(gain); gain.connect(dest); src.start()
  activeNodes.push(src, gain)
  // 注册 Media Session 以支持锁屏控制中心
  const playingItem = selectedItem.value
  setupMediaSession(playingItem?.label || playingItem?.text?.slice(0, 30) || '白噪音')
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

  const { dest } = ensureBgAudioOutput()
  const gain = ctx.createGain()
  gain.gain.value = volume.value / 100
  source.connect(gain)
  gain.connect(dest)

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
  setupMediaSession(item.label || item.text?.slice(0, 30) || '哄睡故事')
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

  const { dest } = ensureBgAudioOutput()
  const gain = ctx.createGain()
  gain.gain.value = volume.value / 100
  source.connect(gain)
  gain.connect(dest)

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
  setupMediaSession(item.label || item.text?.slice(0, 30) || '哄睡故事')
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
  stopAllSounds()
  streamingItem.value = null  // 切换到本地项时清除流媒体状态
  selectedItem.value = item
  selectedItemType.value = type
  // 点击曲目直接开始播放
  startPlayback()
  isPlaying.value = true
}

function startPlayback() {
  if (!selectedItem.value && !streamingItem.value) return
  stopAllSounds()
  const type = selectedItemType.value
  const item = selectedItem.value
  if (type === 'noise') {
    createNoise(item)
  } else if (type === 'song') {
    // 歌曲播放：先尝试 audio_url，失败则自动在线搜索
    const url = item.audioUrl || ''
    const title = item.label || ''
    if (url) {
      playSongAudio(url, title)
    } else {
      isPlaying.value = false
      fallbackToStreaming(title)
      return
    }
    // 拉取 LRC 歌词并启动横向平滑滚动同步（歌曲与流媒体共用）
    if (title) fetchLyrics(title).then(() => startLyricSync())
  } else if (type === 'stream') {
    // 流媒体在线播放
    streamAudioPlay()
  } else if (type === 'tts') {
    // TTS 文本即"歌词"，按句子拆分逐行显示——无需外部拉取
    stopLyricSync()
    lyricsLoading.value = false
    if (item?.text) {
      const result = textToLyricLines(item.text)
      lyrics.value = result.lines
      ttsLyricTotalChars = result.totalChars
    } else {
      lyrics.value = []
      ttsLyricTotalChars = 0
    }
    currentLyricIndex.value = -1
    nextTick(measureLyricGeom)  // 渲染后测量每行位置
    startSmoothLyricScroll()  // 启动横向平滑滚动
    if (customVoiceId.value && cloneAvailable.value) {
      playCloneTTS(item)    // 语音克隆（付费，需密码）
    } else {
      playEdgeTTS(item)     // Edge TTS（免费主力）
    }
  }
}

function togglePlay() {
  if (!selectedItem.value && !streamingItem.value) {
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
  if (selectedItemType.value === 'stream' && streamAudioEl.value) {
    streamAudioEl.value.volume = volume.value / 100
    return
  }
  if (selectedItemType.value === 'noise' && noiseAudio) {
    noiseAudio.volume = volume.value / 100
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
  checkDarkMode()  // 进入页面立即判断
  darkModeTimer = setInterval(checkDarkMode, 60000)  // 每分钟检查一次
  fetchSleepContent()
  fetchVoices()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('resize', measureLyricGeom)
})

onUnmounted(() => {
  stopAllSounds()
  clearTimer()
  if (darkModeTimer) { clearInterval(darkModeTimer); darkModeTimer = null }
  if (previewAudio) { previewAudio.pause(); previewAudio = null }
  if (songAudio) { songAudio.pause(); songAudio = null }
  if (noiseAudio) { noiseAudio.pause(); noiseAudio = null }
  if (streamAudioEl.value) { streamAudioEl.value.pause(); streamAudioEl.value = null }
  if (bgAudioEl) {
    try { bgAudioEl.pause(); bgAudioEl.srcObject = null } catch (e) {}
    bgAudioEl = null
    mediaStreamDest = null
  }
  if (audioCtx) { audioCtx.close() }
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', measureLyricGeom)
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

// "真实音效"标识（OSS 音频文件）
.audio-source-badge {
  font-size: 9px; font-weight: 600; color: #059669;
  background: #d1fae5; border-radius: 3px; padding: 1px 5px;
  white-space: nowrap; flex-shrink: 0; line-height: 1.5;
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
  position: static; flex-shrink: 0;
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

// ====== 在线搜索面板（哄睡神曲） ======
.online-search-panel {
  margin-bottom: 14px;
}
.search-input-row {
  display: flex; gap: 6px; align-items: center;
}
.search-input-wrap {
  flex: 1; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px;
  transition: border-color 0.2s;
  &:focus-within { border-color: #6366f1; background: #fff; }
  .search-icon { color: #94a3b8; flex-shrink: 0; }
}
.search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 13px; color: #1e1b4b;
  &::placeholder { color: #cbd5e1; }
}
.search-clear-btn {
  flex-shrink: 0; width: 22px; height: 22px; border: none; border-radius: 50%;
  background: #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; padding: 0;
  &:hover { background: #cbd5e1; color: #475569; }
}
.platform-select {
  padding: 8px 6px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  font-size: 12px; color: #475569; background: #fff; cursor: pointer; outline: none;
  min-width: 72px; transition: border-color 0.2s;
  &:focus { border-color: #6366f1; }
}
.search-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 12px; border: none; border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: #fff; font-size: 12px; font-weight: 600; cursor: pointer;
  white-space: nowrap; transition: all 0.2s;
  &:hover:not(:disabled) { background: linear-gradient(135deg, #059669, #10b981); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
// 搜索结果
.search-results {
  margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
}
.search-results-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  font-size: 12px; color: #64748b; font-weight: 500;
}
.search-close-btn {
  border: none; background: none; color: #94a3b8; cursor: pointer;
  font-size: 12px; padding: 2px 8px; border-radius: 4px;
  &:hover { color: #64748b; background: #e2e8f0; }
}
.search-result-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: #faf9ff; }
  &.playing { background: #f0edff; }
  &.cached {
    background: #f0fdf6;
    border-left: 3px solid #10b981;
    padding-left: 9px;
    &:hover { background: #e6f9ee; }
  }
}
.sr-thumb {
  width: 48px; height: 36px; border-radius: 6px; overflow: hidden;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; position: relative; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; }
  .el-icon { color: #94a3b8; }
  .sr-play-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    .el-icon { color: #fff; }
  }
  &:hover .sr-play-overlay { opacity: 1; }
}
.sr-info { flex: 1; min-width: 0; cursor: pointer; }
.sr-title {
  font-size: 13px; font-weight: 500; color: #1e1b4b;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;
}
.sr-cached-badge {
  display: inline-block; padding: 0 6px; height: 18px; line-height: 18px;
  border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); color: #fff;
  font-size: 10px; font-weight: 600; margin-right: 6px; vertical-align: middle;
  flex-shrink: 0; white-space: nowrap;
}
.sr-in-list-badge {
  font-size: 10px; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 3px 7px; white-space: nowrap; cursor: default;
}
.sr-meta {
  font-size: 11px; color: #94a3b8; display: flex; gap: 8px;
}
.sr-actions { flex-shrink: 0; }
.sr-save-btn {
  width: 30px; height: 30px; border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #10b981; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; padding: 0;
  &:hover:not(:disabled) { background: #ecfdf5; border-color: #10b981; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
// 搜索提示
.search-hint {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;
  font-size: 12px; color: #92400e;
  .el-icon { color: #f59e0b; flex-shrink: 0; }
}

// 播放器 stream 类型徽章
.player-type-badge.stream {
  background: rgba(16, 185, 129, 0.15); color: #10b981;
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
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px 8px;
  flex-wrap: wrap;
}

// 左侧：封面+信息
.player-left {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
}

// 上下首按钮组
.player-nav {
  display: flex; gap: 4px; flex-shrink: 0;
}

// 其他控制按钮栏
.player-controls {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}

// ====== 移动端：两行布局 ======
@media (max-width: 640px) {
  .player-inner {
    padding: 4px 8px 6px;
    gap: 4px;
  }
  .player-left {
    flex: 1 1 100%;  // 第一行：封面+歌名+类型标签
  }
  .player-controls {
    flex: 1 1 100%;  // 第二行：所有控制按钮
    justify-content: space-evenly;
    overflow: visible;  // 允许下拉菜单弹出不被裁切
    padding-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin-top: 2px;
  }
  .player-lyrics {
    height: 30px; line-height: 30px;
    font-size: 11px;
    .lyric-line { font-size: 11px; padding: 0 8px; }
    .lyric-line.active { font-size: 11px; }
  }
}
.player-cover {
  appearance: none; outline: none; padding: 0;
  width: 32px; height: 32px; min-width: 32px;
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

// 滚动歌词（横向平滑滚动）
.player-lyrics {
  flex: 1.5; min-width: 0; height: 36px; line-height: 36px;
  position: relative;  // 让每行 offsetLeft 相对本容器，固定渐变才准确
  overflow-x: auto; overflow-y: hidden;
  white-space: nowrap;
  mask-image: linear-gradient(to right, transparent 0%, white 4%, white 96%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, white 4%, white 96%, transparent 100%);
  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
  display: flex; align-items: center;
  &.loading {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; color: #6b7280;
    .el-icon { color: #a78bfa; }
  }
  &.no-lyrics {
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: #6b7280;
  }
}

// --- 逐行歌词（固定渐变：始终锚定到盒子左→右，所有可见歌词统一渐变） ---
.lyric-line {
  display: inline-block; padding: 0 14px; font-size: 13px;
  color: #6366f1; opacity: 1; transition: font-weight 0.3s;
  // 渐变背景的尺寸固定为容器可见宽度，再由 JS 每帧把位置锚定到可见窗口，
  // 从而让每一句可见文字都呈现“盒子左边深→右边浅”的渐变，并随阅读匀速滚动。
  background-image: linear-gradient(90deg, #6366f1 0%, #818cf8 50%, #c4b5fd 100%);
  background-size: var(--lw, 100%) 100%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  &.active { font-weight: 700; }  // 当前句仅靠加粗标识，颜色仍统一为左→右渐变
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

// 音量下拉（垂直滑块）
.volume-drop { min-width: auto; padding: 8px 6px; }
.volume-drop-col {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  .vol-icon { color: #9ca3af; cursor: pointer; flex-shrink: 0; &:hover { color: #c4b5fd; } }
  .vol-num { font-size: 12px; font-weight: 600; color: #a78bfa; text-align: center; }
}
.volume-slider-drop {
  -webkit-appearance: slider-vertical; appearance: slider-vertical;
  writing-mode: vertical-lr; direction: rtl; /* Firefox 兼容，0在下100在上 */
  width: 20px; height: 100px; cursor: pointer;
  background: rgba(255, 255, 255, 0.12); border-radius: 4px; outline: none;
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
  .player-cover { width: 38px; height: 38px; min-width: 38px; }
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
  .player-cover { width: 36px; height: 36px; min-width: 36px; }
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

// ====== 深色模式（晚上8点 ~ 早上7点自动切换） ======
.baby-sleep-page.dark-mode {
  background: #0f0f1a;
  // 页面头部
  .page-title { color: #e2dee9; .el-icon { color: #a78bfa; } }
  .page-desc { color: #94a3b8; }

  // 分类 Tab
  .tab-btn {
    border-color: #2d2d4a; background: #1e1e2e; color: #94a3b8;
    &:hover { border-color: #6d5acf; color: #a78bfa; background: #252540; }
    &.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
  }

  // 排序工具栏
  .sort-hint { color: #6b7280; &:hover { color: #a78bfa; } }
  .sort-btn {
    border-color: #2d2d4a; background: #1e1e2e; color: #94a3b8;
    &:hover { border-color: #6d5acf; color: #a78bfa; }
    &.active { background: #252040; border-color: #6d5acf; color: #a78bfa; }
  }

  // 白噪音卡片
  .sound-card {
    border-color: #2d2d4a; background: #1e1e2e;
    &:hover { border-color: #6d5acf; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.12); }
    &.active { border-color: #6d5acf; background: #252040; }
    &.playing { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15); }
  }
  .sound-label { color: #cbd5e1; }
  .sound-playing-dot { background: #a78bfa; }

  // 播放次数徽章
  .play-count-badge { color: #a78bfa; background: #252040; }

  // "真实音效"标识
  .audio-source-badge { color: #34d399; background: #064e3b; }

  // 添加按钮
  .add-item-btn { border-color: #4c3d8f; background: #1e1e2e; color: #a78bfa; &:hover { background: #252540; border-color: #6d5acf; } }

  // 内容卡片（故事、诗歌等）
  .content-card {
    border-color: #2d2d4a; background: #1e1e2e;
    &:hover { border-color: #6d5acf; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.08); }
    &.active { border-color: #6d5acf; background: #252040; }
    &.playing { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1); }
  }
  .content-title { color: #e2dee9; }
  .content-meta { color: #6b7280; }
  .audio-dot { &.has { color: #34d399; } &.none { color: #4b5563; } }
  .content-playing-dot { background: #a78bfa; }

  // 卡片操作按钮
  .card-action-btn {
    &.edit { background: rgba(139, 92, 246, 0.12); color: #a78bfa; &:hover { background: #7c3aed; color: #fff; } }
    &.delete { background: rgba(239, 68, 68, 0.12); color: #f87171; &:hover { background: #ef4444; color: #fff; } }
  }

  // 在线搜索面板
  .search-input-wrap {
    background: #1a1a2e; border-color: #2d2d4a;
    &:focus-within { border-color: #7c3aed; background: #1e1e2e; }
    .search-icon { color: #6b7280; }
  }
  .search-input { color: #e2dee9; &::placeholder { color: #4b5563; } }
  .search-clear-btn { background: #2d2d4a; color: #94a3b8; &:hover { background: #3d3d5a; color: #cbd5e1; } }
  .platform-select { border-color: #2d2d4a; color: #cbd5e1; background: #1e1e2e; &:focus { border-color: #7c3aed; } }
  .search-results { border-color: #2d2d4a; }
  .search-results-header { background: #1a1a2e; border-bottom-color: #2d2d4a; color: #94a3b8; }
  .search-close-btn { color: #6b7280; &:hover { color: #cbd5e1; background: #2d2d4a; } }
  .search-result-item {
    border-bottom-color: #252540;
    &:hover { background: #1e1e2e; }
    &.playing { background: #252040; }
    &.cached { background: #0d2818; border-left-color: #34d399; &:hover { background: #0f3020; } }
  }
  .sr-title { color: #e2dee9; }
  .sr-meta { color: #6b7280; }
  .sr-in-list-badge { color: #6b7280; border-color: #2d2d4a; }
  .sr-save-btn { border-color: #2d2d4a; background: #1e1e2e; color: #34d399; &:hover:not(:disabled) { background: #0d2818; border-color: #34d399; } }
  .search-hint { background: #1c1a0a; border-color: #5c4a0a; color: #fcd34d; .el-icon { color: #fbbf24; } }
  .sr-thumb { background: #1a1a2e; .el-icon { color: #6b7280; } }

  // 播放器面板（已为深色，微调）
  .player-panel {
    background: linear-gradient(180deg, #1a1825 0%, #0f0f1a 100%);
    border-top-color: rgba(255, 255, 255, 0.04);
  }
  .ctrl-pill {
    border-color: rgba(255, 255, 255, 0.08);
    &:hover { border-color: rgba(167, 139, 250, 0.2); }
  }
  .dropdown-menu { background: #1a1825; border-color: rgba(255, 255, 255, 0.06); }
  .dropdown-item {
    &:hover { background: rgba(167, 139, 250, 0.08); }
    &.active { background: rgba(167, 139, 250, 0.12); }
  }

  // 弹窗（密码、克隆、编辑）
  .password-modal, .clone-modal, .edit-modal {
    background: #1e1e2e;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .password-header, .clone-header, .edit-header {
    border-bottom-color: #2d2d4a;
    h3 { color: #e2dee9; }
  }
  .password-close, .clone-close, .edit-close {
    background: #2d2d4a; color: #94a3b8;
    &:hover { background: #3d3d5a; }
  }
  .password-desc { color: #94a3b8; }
  .password-input, .clone-name-input, .edit-field input, .edit-field textarea, .edit-field select {
    border-color: #2d2d4a; background: #1a1a2e; color: #e2dee9;
    &:focus { border-color: #7c3aed; }
  }
  .password-footer, .clone-footer, .edit-footer, .clone-name-row {
    border-top-color: #2d2d4a;
  }
  .password-cancel-btn, .clone-cancel-btn, .edit-cancel-btn {
    background: #1e1e2e; border-color: #2d2d4a; color: #94a3b8;
    &:hover { background: #252540; }
  }
  .edit-field label, .clone-name-row label { color: #cbd5e1; }
  .icon-color-swatch { &:hover { border-color: #6d5acf; } }

  // 提示卡片
  .tip-card { background: #1c1a0a; border-color: #5c4a0a; color: #fcd34d; .el-icon { color: #fbbf24; } }

  // 上传区域
  .clone-upload { border-color: #3d3d5a; color: #94a3b8; &:hover { border-color: #6d5acf; background: #1e1e2e; } &.has-file { border-color: #6d5acf; background: #1a1830; } p { color: #94a3b8; } .file-name { color: #e2dee9; } .file-size { color: #6b7280; } .upload-hint { color: #6b7280; } .el-icon { color: #6d5acf; } }
}

</style>

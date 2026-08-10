<template>
  <div class="treehole-stream">
    <!-- 浮动表情反馈 -->
    <TransitionGroup name="float-up" tag="div" class="floating-emojis">
      <span
        v-for="emoji in floatingEmojis"
        :key="emoji.id"
        class="float-emoji"
        :style="{ left: emoji.x + '%', animationDelay: emoji.delay + 's' }"
      >{{ emoji.char }}</span>
    </TransitionGroup>

    <!-- 树洞卡片列表 -->
    <div v-if="moods.length > 0" class="mood-cards">
      <TransitionGroup name="card-enter">
        <div
          v-for="(mood, idx) in moods"
          :key="mood.id"
          class="mood-card"
          :class="{
            anonymous: mood.isAnonymous,
            shaking: shakingId === mood.id,
            expanded: expandedMoodId === mood.id
          }"
          :style="{ animationDelay: idx * 0.05 + 's' }"
        >
          <div class="mood-card-inner" @click="toggleComments(mood)">
            <div class="mood-card-header">
              <div class="mood-user">
                <span v-if="mood.isAnonymous" class="mask-name">🦊 {{ mood.animalMask }}</span>
                <span v-else class="real-name">{{ mood.creatorName || '匿名' }}</span>
                <span class="mood-weather" v-if="mood.moodWeather">{{ mood.moodWeather }}</span>
              </div>
              <span class="mood-time">{{ timeAgo(mood.createdAt) }}</span>
            </div>

            <div class="mood-content">{{ mood.content }}</div>

            <!-- 点击涟漪 -->
            <div v-if="rippleId === mood.id" class="ripple" :style="{ left: rippleX + '%', top: rippleY + '%' }"></div>
          </div>

          <div class="mood-card-footer">
            <div class="mood-footer-left">
              <span v-if="mood.wishId" class="mood-linked-wish">
                <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                </svg>
                关联愿望
              </span>
              <!-- 评论数 -->
              <span class="mood-comment-count" @click.stop="toggleComments(mood)">
                <svg class="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {{ mood._commentCount ?? 0 }}
              </span>
            </div>
            <div class="mood-actions" v-if="mood.isMine || !mood.isAnonymous">
              <el-button
                v-if="mood.isMine"
                text
                size="small"
                class="btn-mood-delete"
                @click.stop="handleDelete(mood.id)"
              >删除</el-button>
              <el-button
                v-if="detectWishIntent(mood.content) && !mood.wishId"
                text
                size="small"
                class="btn-convert-wish"
                @click.stop="$emit('convert', mood.id)"
              >💡 点亮为愿望</el-button>
              <el-button
                v-if="!mood.isMine"
                text
                size="small"
                class="btn-pat"
                @click.stop="handlePat(mood)"
              >👋 拍一拍</el-button>
            </div>
          </div>

          <!-- 评论区（展开时显示） -->
          <Transition name="comment-slide">
            <div v-if="expandedMoodId === mood.id" class="mood-comments-section" @click.stop>
              <!-- 已有评论列表 -->
              <div v-if="(mood._comments || []).length > 0" class="comments-list">
                <div
                  v-for="c in mood._comments"
                  :key="c.id"
                  class="comment-item"
                >
                  <span class="comment-user">
                    <template v-if="c.isAnonymous">🦊 {{ c.animalMask }}</template>
                    <template v-else>{{ c.creatorName || '匿名' }}</template>
                  </span>
                  <span class="comment-content">{{ c.content }}</span>
                  <span class="comment-time">{{ timeAgo(c.createdAt) }}</span>
                  <el-button
                    v-if="c.isMine"
                    text
                    size="small"
                    class="btn-comment-delete"
                    @click.stop="handleDeleteComment(mood, c.id)"
                  >×</el-button>
                </div>
              </div>
              <div v-else class="comments-empty">暂无评论，来说点什么吧~</div>

              <!-- 表情选择区 -->
              <div class="emoji-picker-area">
                <div class="emoji-row-wrap">
                  <div
                    class="emoji-grid"
                    :class="{ collapsed: !emojiExpanded[mood.id] }"
                    ref="emojiGridRefs"
                    :data-mood-id="mood.id"
                  >
                    <span
                      v-for="e in emojiPool"
                      :key="e"
                      class="emoji-cell"
                      @click="insertEmoji(mood, e)"
                    >{{ e }}</span>
                  </div>
                  <span
                    v-if="emojiOverflow[mood.id]"
                    class="emoji-toggle"
                    @click="toggleEmojiExpand(mood)"
                  >
                    {{ emojiExpanded[mood.id] ? '⌃' : '⌄' }}
                  </span>
                </div>
              </div>

              <!-- 输入框 -->
              <div class="comment-input-row">
                <el-input
                  v-model="commentInputs[mood.id]"
                  size="small"
                  placeholder="说点什么..."
                  maxlength="200"
                  @keyup.enter="sendComment(mood)"
                />
                <el-button
                  size="small"
                  type="primary"
                  :disabled="!commentInputs[mood.id]?.trim()"
                  :loading="commentSending[mood.id]"
                  @click="sendComment(mood)"
                >发送</el-button>
              </div>
            </div>
          </Transition>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon pulse-tree">🌳</div>
      <p class="empty-text">树洞里还没有声音</p>
      <p class="empty-hint">来说说你的心里话吧</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { get, post, del } from '@/api/request'

const emit = defineEmits(['convert', 'pat'])
const store = useStore()

const moods = computed(() => store.state.wishTreeHole.moods)

// ==================== 评论状态 ====================
const expandedMoodId = ref(null)
const commentInputs = reactive({})
const commentSending = reactive({})

// ==================== 表情选择器 ====================
const emojiPool = [
  // 表情
  '😊', '😂', '🤣', '😍', '🥰', '😘', '😜', '🤪',
  '😎', '🤩', '🥳', '😇', '🤗', '😋', '😴', '🤔',
  '😢', '😭', '😤', '😡', '🤬', '😱', '😨', '😰',
  // 手势
  '👍', '👎', '👏', '🙌', '🤝', '💪', '🤞', '✌️',
  // 爱心
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💖', '💗', '💝', '💕', '💞', '💓', '🫶',
  // 自然
  '🌸', '🌺', '🌻', '🌹', '🌷', '💐', '🌿', '🍀',
  '☀️', '🌈', '⭐', '✨', '💫', '🔥', '💧', '❄️',
  // 动物
  '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🐸', '🐵', '🐤', '🦄', '🐙', '🦋', '🐝', '🐳',
  // 饮食
  '🎂', '🍰', '🧁', '🍕', '🍔', '🌮', '🍣', '🍩',
  '☕', '🍵', '🧃', '🍺', '🍷', '🥤', '🍿', '🍦',
  // 庆祝
  '🎉', '🎊', '🎈', '🎀', '🎁', '🏆', '🥇', '👑',
  '💯', '✅', '🎵', '🎶', '💤', '💢', '💣', '🫧'
]

const emojiExpanded = reactive({})
const emojiOverflow = reactive({})
const emojiGridRefs = ref({})

function toggleEmojiExpand(mood) {
  emojiExpanded[mood.id] = !emojiExpanded[mood.id]
}

function insertEmoji(mood, emoji) {
  const current = commentInputs[mood.id] || ''
  commentInputs[mood.id] = current + emoji
}

// 检测表情网格是否溢出（超过一行），在每个评论区展开时检测
watch(expandedMoodId, async (moodId) => {
  if (!moodId) return
  await nextTick()
  // 用 ref 查找对应的 emoji-grid
  const grids = document.querySelectorAll('.emoji-grid')
  grids.forEach(grid => {
    const mid = grid.getAttribute('data-mood-id')
    if (mid === moodId) {
      // 检测是否超过一行：比较 scrollHeight 和第一行高度
      const lineHeight = 32 // emoji-cell 高度 + gap
      emojiOverflow[mid] = grid.scrollHeight > lineHeight + 4
      // 默认折叠
      if (emojiExpanded[mid] === undefined) {
        emojiExpanded[mid] = false
      }
    }
  })
})

// ==================== 浮动表情 ====================
const floatingEmojis = ref([])
let emojiId = 0

function spawnFloatingEmojis(count = 4) {
  const emojis = ['💚', '🌿', '✨', '🍃', '💫', '🌱', '🫧']
  const now = []
  for (let i = 0; i < count; i++) {
    now.push({
      id: ++emojiId,
      char: emojis[Math.floor(Math.random() * emojis.length)],
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.3
    })
  }
  floatingEmojis.value = [...floatingEmojis.value, ...now].slice(-12)
  setTimeout(() => {
    floatingEmojis.value = floatingEmojis.value.filter(e => !now.find(n => n.id === e.id))
  }, 1500)
}

// ==================== 摇晃动画 ====================
const shakingId = ref(null)

function triggerShake(id) {
  shakingId.value = id
  setTimeout(() => { shakingId.value = null }, 500)
}

// ==================== 点击涟漪 ====================
const rippleId = ref(null)
const rippleX = ref(50)
const rippleY = ref(50)

function triggerRipple(moodId) {
  rippleId.value = moodId
  rippleX.value = 30 + Math.random() * 40
  rippleY.value = 30 + Math.random() * 40
  setTimeout(() => { rippleId.value = null }, 600)
}

// ==================== 评论相关 ====================
async function loadComments(mood) {
  try {
    const res = await get(`/wish-tree-hole/moods/${mood.id}/comments`)
    if (res.success) {
      mood._comments = res.data || []
      mood._commentCount = (res.data || []).length
    }
  } catch (e) {
    mood._comments = []
    mood._commentCount = 0
  }
}

function toggleComments(mood) {
  triggerRipple(mood.id)
  if (expandedMoodId.value === mood.id) {
    expandedMoodId.value = null
  } else {
    expandedMoodId.value = mood.id
    // 确保评论数据已加载
    if (!mood._comments) {
      loadComments(mood)
    }
  }
}

async function sendComment(mood) {
  const content = commentInputs[mood.id]?.trim()
  if (!content) return
  commentSending[mood.id] = true
  try {
    const isAnonymous = mood.isAnonymous ? true : false  // 如果树洞是匿名的，评论也默认匿名
    const res = await post(`/wish-tree-hole/moods/${mood.id}/comments`, {
      content,
      isAnonymous
    })
    if (res.success) {
      commentInputs[mood.id] = ''
      // 刷新评论
      await loadComments(mood)
      // 反馈
      spawnFloatingEmojis(2)
    } else {
      ElMessage.error(res.error || '评论失败')
    }
  } catch (e) {
    ElMessage.error('评论失败')
  } finally {
    commentSending[mood.id] = false
  }
}

async function handleDeleteComment(mood, commentId) {
  try {
    const res = await del(`/wish-tree-hole/comments/${commentId}`)
    if (res.success) {
      await loadComments(mood)
      ElMessage.success('已删除')
    } else {
      ElMessage.error(res.error || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

// ==================== 工具函数 ====================
function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

function detectWishIntent(content) {
  return /我想|我希望|我想做|我想去|我想学|我要/.test(content)
}

// ==================== 原有操作 ====================
async function handleDelete(id) {
  await store.dispatch('wishTreeHole/deleteMood', id)
  ElMessage.success('已删除')
}

async function handlePat(mood) {
  triggerShake(mood.id)
  spawnFloatingEmojis(3)
  await store.dispatch('wishTreeHole/patUser', {
    toUserId: mood.userId,
    targetType: 'mood',
    targetId: mood.id,
    message: `拍了拍${mood.isAnonymous ? ' ' + mood.animalMask : '你'}`
  })
  ElMessage.success('已发送')
}

// ==================== 初始化评论计数 ====================
// moods 变化时，批量加载评论数
watch(moods, async (newMoods) => {
  if (!newMoods || newMoods.length === 0) return
  for (const mood of newMoods) {
    if (mood._commentCount === undefined) {
      try {
        const res = await get(`/wish-tree-hole/moods/${mood.id}/comments`)
        if (res.success) {
          mood._comments = res.data || []
          mood._commentCount = (res.data || []).length
        }
      } catch (e) {
        mood._commentCount = 0
      }
    }
  }
}, { immediate: true })
</script>

<style lang="scss" scoped src="./TreeHoleStream.scss"></style>

<style lang="scss">
html.dark-mode {
  .mood-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12); transform: translateY(-2px); }
    &.anonymous { background: #1a2332; border-color: #2d2d4a; }
    &.expanded { border-color: #a78bfa; box-shadow: 0 4px 20px rgba(167, 139, 250, 0.1); }
  }
  .real-name { color: #e2dee9; }
  .mood-content { color: #94a3b8; }
  .mood-card-footer { border-color: #2d2d4a; }
  .mood-linked-wish { color: #a78bfa; }
  .mask-name { color: #34d399; }

  // 评论
  .mood-comment-count {
    // background: #252540;
    color: #94a3b8;
    // &:hover { color: #a78bfa; background: #2d2d4a; }
  }
  .mood-linked-wish {
    color: #fbbf24;
    background: #2d2414;
    &:hover { background: #3d3418; }
  }
  .mood-footer-left {
    .footer-icon { color: inherit; }
  }
  .mood-comments-section {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }
  .comment-item {
    background: #252540;
    .comment-user { color: #a78bfa; }
    .comment-content { color: #94a3b8; }
    .comment-time { color: #64748b; }
  }
  .comments-empty { color: #64748b; }
  .emoji-cell {
    &:hover { background: #2d2d4a; }
  }
  .emoji-toggle {
    color: #64748b;
    &:hover { color: #a78bfa; }
  }
  .comment-input-row {
    :deep(.el-input__wrapper) {
      background: #252540;
      box-shadow: 0 0 0 1px #2d2d4a inset;
      &:hover { box-shadow: 0 0 0 1px #a78bfa inset; }
      &.is-focus { box-shadow: 0 0 0 1px #a78bfa inset; }
    }
    :deep(.el-input__inner) {
      color: #e2dee9;
      &::placeholder { color: #64748b; }
    }
  }
  .btn-comment-delete {
    color: #64748b !important;
    &:hover { color: #ef4444 !important; }
  }

  // 空状态
  .empty-state {
    .empty-text { color: #94a3b8; }
    .empty-hint { color: #64748b; }
  }
}
</style>

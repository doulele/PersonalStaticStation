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

<style lang="scss" scoped>
.treehole-stream {
  position: relative;
}

// ====== 浮动表情 ======
.floating-emojis {
  position: fixed;
  top: 50%;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 200;
}

.float-emoji {
  position: absolute;
  font-size: 28px;
  animation: floatUp 1.5s ease-out forwards;
}

@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: translateY(-40px) scale(1.2) rotate(10deg); }
  100% { opacity: 0; transform: translateY(-120px) scale(0.6) rotate(-15deg); }
}

// ====== 卡片入场 ======
.card-enter-enter-active {
  animation: cardSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.card-enter-leave-active {
  animation: cardSlideOut 0.3s ease-in both;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes cardSlideOut {
  to { opacity: 0; transform: translateY(-8px) scale(0.96); }
}

// ====== 表情浮动 ======
.float-up-enter-active { animation: floatIn 0.3s ease-out; }
.float-up-leave-active { animation: floatOut 0.5s ease-in; }

@keyframes floatIn {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes floatOut {
  to { opacity: 0; transform: scale(0.5) translateY(-20px); }
}

.mood-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mood-card {
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);

    &::before { opacity: 1; }
  }

  &:active { transform: scale(0.99); }

  &.anonymous {
    background: linear-gradient(135deg, #f0f9ff, #ecfdf5);
    border-color: #e2e8f0;
  }

  &.shaking {
    animation: shake 0.4s ease;
  }

  &.expanded {
    border-color: #6366f1;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

// ====== 卡片内部（可点击展开评论） ======
.mood-card-inner {
  padding: 16px 16px 0;
  cursor: pointer;
  position: relative;
}

// ====== 点击涟漪 ======
.ripple {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  transform: translate(-50%, -50%) scale(0);
  animation: rippleEffect 0.6s ease-out;
  pointer-events: none;
}

@keyframes rippleEffect {
  to { transform: translate(-50%, -50%) scale(20); opacity: 0; }
}

.mood-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mood-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mask-name {
  font-size: 14px;
  font-weight: 600;
  color: #059669;
}

.real-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.mood-weather {
  font-size: 16px;
}

.mood-time {
  font-size: 12px;
  color: #94a3b8;
}

.mood-content {
  font-size: 15px;
  color: #64748b;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  padding-bottom: 12px;
}

// ====== 卡片底部 ======
.mood-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.mood-footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mood-linked-wish {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #f59e0b;
  padding: 4px 10px;
  border-radius: 20px;
  background: #fffbeb;
  transition: all 0.2s ease;

  &:hover {
    background: #fef3c7;
  }
}

// 评论数
.mood-comment-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 20px;
  // background: #f1f5f9;
  transition: all 0.2s ease;

  &:hover {
    color: #6366f1;
    // background: #eef2ff;
  }

  &:active {
    transform: scale(0.96);
  }
}

// 通用 footer icon
.footer-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.mood-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

// ====== 评论区 ======
.mood-comments-section {
  border-top: 1px solid #e2e8f0;
  padding: 12px 16px 16px;
  background: #fafbfd;
}

// 评论滑入动画
.comment-slide-enter-active {
  animation: commentSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.comment-slide-leave-active {
  animation: commentSlideOut 0.2s ease-in;
}

@keyframes commentSlideIn {
  from { opacity: 0; max-height: 0; transform: translateY(-8px); }
  to { opacity: 1; max-height: 500px; transform: translateY(0); }
}
@keyframes commentSlideOut {
  from { opacity: 1; max-height: 500px; transform: translateY(0); }
  to { opacity: 0; max-height: 0; transform: translateY(-8px); }
}

// 评论列表
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  max-height: 220px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.55;
  animation: commentItemIn 0.25s ease-out;
}

@keyframes commentItemIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.comment-user {
  font-weight: 600;
  color: #6366f1;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 12px;
  padding-top: 1px;
}

.comment-content {
  color: #334155;
  flex: 1;
  word-break: break-word;
  min-width: 0;
}

.comment-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
  padding-top: 1px;
}

.btn-comment-delete {
  color: #cbd5e1 !important;
  font-size: 16px !important;
  padding: 0 !important;
  min-height: auto !important;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  &:hover { color: #ef4444 !important; }
}

.comments-empty {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  padding: 12px 0 14px;
}

// ====== 表情选择区 ======
.emoji-picker-area {
  margin-bottom: 10px;
}

.emoji-row-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex: 1;
  min-width: 0;
  max-height: none;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.collapsed {
    max-height: 32px;
  }
}

.emoji-cell {
  font-size: 17px;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    background: #eef2ff;
    transform: scale(1.15);
  }

  &:active {
    transform: scale(0.85);
  }
}

.emoji-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transform: translateY(-5px) scaleX(1.8);
  color: #94a3b8;
  cursor: pointer;
  // width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 2px;

  &:hover {
    color: #6366f1;
    background: #eef2ff;
  }
}

// ====== 评论输入行 ======
.comment-input-row {
  display: flex;
  gap: 8px;
  align-items: center;

  :deep(.el-input) {
    flex: 1;
  }

  :deep(.el-input__wrapper) {
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    transition: all 0.2s ease;
    padding: 5px 14px;

    &:hover { box-shadow: 0 0 0 1px #6366f1 inset; }
    &.is-focus { box-shadow: 0 0 0 1px #6366f1 inset; }
  }

  :deep(.el-input__inner) {
    height: 34px;
    line-height: 34px;
    font-size: 14px;
  }

  :deep(.el-button) {
    border-radius: 20px;
    flex-shrink: 0;
    height: 34px;
    padding: 6px 16px;
    font-size: 13px;
  }
}

// ====== 空状态 ======
.empty-state {
  text-align: center;
  padding: 100px 20px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    display: inline-block;
    animation: pulseTree 2s ease-in-out infinite;
  }
  .empty-text { font-size: 18px; color: #64748b; margin: 0 0 8px; }
  .empty-hint { font-size: 14px; color: #94a3b8; margin: 0; }
}

@keyframes pulseTree {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.pulse-tree { animation: pulseTree 2s ease-in-out infinite; }

// ====== 操作按钮颜色 ======
.btn-mood-delete { color: #ef4444; &:hover { color: #dc2626; background: #fef2f2; } }
.btn-convert-wish { color: #f59e0b; &:hover { color: #d97706; background: #fffbeb; } }
.btn-pat { color: #6366f1; &:hover { color: #4f46e5; background: #eef2ff; } }

// ====== 移动端 ======
@media (max-width: 768px) {
  .mood-cards { gap: 12px; }
  .mood-card-inner { padding: 14px 14px 0; }
  .mood-card {
    border-radius: 14px;

    &:hover {
      transform: none;
      &::before { opacity: 0; }
    }
  }
  .mood-content { font-size: 14px; line-height: 1.6; padding-bottom: 8px; }
  .mood-card-header { margin-bottom: 8px; }
  .mood-card-footer {
    padding: 10px 14px;
  }
  .mood-actions {
    .el-button { padding: 4px 8px; font-size: 12px; }
  }
  .mood-comments-section {
    padding: 10px 12px 14px;
  }
  .comment-item {
    font-size: 12px;
    padding: 6px 10px;
    gap: 6px;
  }
  .comment-user { font-size: 11px; }
  .comment-time { font-size: 10px; }
  .emoji-cell { font-size: 15px; width: 28px; height: 28px; }
  .emoji-grid.collapsed { max-height: 30px; }
  .emoji-toggle { height: 28px; width: 30px; font-size: 13px; }
  .comment-input-row {
    gap: 6px;
    :deep(.el-input__wrapper) { border-radius: 18px; padding: 4px 12px; }
    :deep(.el-input__inner) { height: 32px; line-height: 32px; font-size: 13px; }
    :deep(.el-button) { border-radius: 18px; padding: 5px 12px; font-size: 12px; height: 32px; }
  }
  .comments-list { max-height: 160px; }
  .empty-state { padding: 60px 16px;
    .empty-icon { font-size: 48px; }
  }
  .float-emoji { font-size: 22px; }
}

@media (max-width: 480px) {
  .mood-card-inner { padding: 12px 12px 0; }
  .mood-card-footer { padding: 8px 12px; }
  .mood-comments-section { padding: 8px 10px 12px; }
}
</style>

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

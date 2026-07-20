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
        <div v-for="(mood, idx) in moods" :key="mood.id" class="mood-card" :class="{ anonymous: mood.isAnonymous, shaking: shakingId === mood.id }" :style="{ animationDelay: idx * 0.05 + 's' }" @click="handleCardClick(mood)">
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

          <div class="mood-card-footer">
            <span v-if="mood.wishId" class="mood-linked-wish">
              📌 关联愿望
            </span>
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
import { computed, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['convert', 'pat'])
const store = useStore()

const moods = computed(() => store.state.wishTreeHole.moods)

// 浮动表情
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

// 摇晃动画
const shakingId = ref(null)

function triggerShake(id) {
  shakingId.value = id
  setTimeout(() => { shakingId.value = null }, 500)
}

// 点击涟漪
const rippleId = ref(null)
const rippleX = ref(50)
const rippleY = ref(50)

function handleCardClick(mood) {
  rippleId.value = mood.id
  rippleX.value = 30 + Math.random() * 40
  rippleY.value = 30 + Math.random() * 40
  setTimeout(() => { rippleId.value = null }, 600)
}

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
  padding: 16px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: default;

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

  // 摇晃动画
  &.shaking {
    animation: shake 0.4s ease;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(3px); }
}

// 点击涟漪
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
}

.mood-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.mood-linked-wish {
  font-size: 12px;
  color: #6366f1;
}

.mood-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
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

@media (max-width: 768px) {
  .mood-cards { gap: 12px; }
  .mood-card { padding: 14px; border-radius: 14px; }
  .mood-content { font-size: 14px; line-height: 1.6; }
  .mood-card-header { margin-bottom: 8px; }
  .mood-card-footer {
    margin-top: 10px;
    padding-top: 10px;
  }
  .mood-actions {
    .el-button { padding: 4px 8px; font-size: 12px; }
  }
  .empty-state { padding: 60px 16px;
    .empty-icon { font-size: 48px; }
  }
  .float-emoji { font-size: 22px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mood-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12); transform: translateY(-2px); }
    &.anonymous { background: #1a2332; border-color: #2d2d4a; }
  }
  .real-name { color: #e2dee9; }
  .mood-content { color: #94a3b8; }
  .mood-card-footer { border-color: #2d2d4a; }
  .mood-linked-wish { color: #a78bfa; }
  .mask-name { color: #34d399; }
  .empty-state {
    .empty-text { color: #94a3b8; }
    .empty-hint { color: #64748b; }
  }
}
</style>

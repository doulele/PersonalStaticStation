<template>
  <div class="treehole-stream">
    <!-- 树洞卡片列表 -->
    <div v-if="moods.length > 0" class="mood-cards">
      <div v-for="mood in moods" :key="mood.id" class="mood-card" :class="{ anonymous: mood.isAnonymous }">
        <div class="mood-card-header">
          <div class="mood-user">
            <span v-if="mood.isAnonymous" class="mask-name">🦊 {{ mood.animalMask }}</span>
            <span v-else class="real-name">{{ mood.creatorName || '匿名' }}</span>
            <span class="mood-weather" v-if="mood.moodWeather">{{ mood.moodWeather }}</span>
          </div>
          <span class="mood-time">{{ timeAgo(mood.createdAt) }}</span>
        </div>

        <div class="mood-content">{{ mood.content }}</div>

        <div class="mood-card-footer">
          <span v-if="mood.wishId" class="mood-linked-wish">
            📌 关联愿望
          </span>
          <div class="mood-actions" v-if="mood.isMine || !mood.isAnonymous">
            <el-button
              v-if="mood.isMine"
              text
              size="small"
              type="danger"
              @click="handleDelete(mood.id)"
            >删除</el-button>
            <el-button
              v-if="detectWishIntent(mood.content) && !mood.wishId"
              text
              size="small"
              type="primary"
              @click="$emit('convert', mood.id)"
            >点亮为愿望</el-button>
            <el-button
              v-if="!mood.isMine"
              text
              size="small"
              @click="handlePat(mood)"
            >👋 拍一拍</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🌳</div>
      <p class="empty-text">树洞里还没有声音</p>
      <p class="empty-hint">点击右下角按钮，说说你的心里话吧</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['convert', 'pat'])
const store = useStore()

const moods = computed(() => store.state.wishTreeHole.moods)

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
.mood-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mood-card {
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    border-color: #10b981;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
  }

  &.anonymous {
    background: linear-gradient(135deg, #f8fafc, #f0fdf4);
    border-color: #d1fae5;
  }
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
  color: #334155;
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
  border-top: 1px solid #f1f5f9;
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

.empty-state {
  text-align: center;
  padding: 100px 20px;
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-text { font-size: 16px; color: #64748b; margin: 0 0 8px; }
  .empty-hint { font-size: 13px; color: #94a3b8; margin: 0; }
}

@media (max-width: 768px) {
  .mood-cards { gap: 10px; }
  .mood-card { padding: 16px; border-radius: 14px; }
  .mood-content { font-size: 14px; line-height: 1.6; }
  .mood-card-header { margin-bottom: 8px; }
  .mood-card-footer {
    margin-top: 10px;
    padding-top: 10px;
  }
  .mood-actions {
    .el-button { padding: 4px 8px; font-size: 12px; }
  }
  .empty-state { padding: 60px 16px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mood-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #059669; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1); }
    &.anonymous { background: linear-gradient(135deg, #1e1e2e, #1a2e24); border-color: #1f4a3a; }
  }
  .real-name { color: #e2dee9; }
  .mood-content { color: #94a3b8; }
  .mood-card-footer { border-color: #2d2d4a; }
  .mood-linked-wish { color: #a78bfa; }
  .mask-name { color: #34d399; }
}
</style>

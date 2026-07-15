<template>
  <el-dialog
    :model-value="visible" @update:model-value="(val) => emit('update:visible', val)"
    title="发布树洞"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="mood-post">
      <el-input
        v-model="content"
        type="textarea"
        :rows="5"
        placeholder="此刻，你想说什么？..."
        maxlength="500"
        show-word-limit
        resize="none"
      />

      <div class="mood-options">
        <div class="option-row">
          <span class="option-label">心情天气</span>
          <div class="weather-options">
            <span
              v-for="w in weathers"
              :key="w.value"
              class="weather-item"
              :class="{ active: weather === w.value }"
              @click="weather = w.value"
              :title="w.label"
            >{{ w.emoji }}</span>
          </div>
        </div>

        <div class="option-row">
          <span class="option-label">关联愿望（可选）</span>
          <el-select v-model="selectedWish" filterable placeholder="选择愿望" size="small" clearable style="width: 200px;">
            <el-option
              v-for="w in activeWishes"
              :key="w.id"
              :label="w.title"
              :value="w.id"
            />
          </el-select>
        </div>

        <div class="option-row">
          <el-switch v-model="anonymous" active-text="匿名发布" inactive-text="实名发布" />
          <span v-if="anonymous" class="mask-preview">🦊 将以随机动物马甲发布</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="success" :loading="posting" @click="handlePost" :disabled="!content.trim()">
        发布树洞
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible', 'posted'])
const store = useStore()

const content = ref('')
const anonymous = ref(true)
const weather = ref('')
const selectedWish = ref(null)
const posting = ref(false)

const activeWishes = computed(() => store.getters['wishTreeHole/activeWishes'])

const weathers = [
  { emoji: '☀️', label: '晴天/积极', value: '☀️ 积极' },
  { emoji: '☁️', label: '多云/平静', value: '☁️ 平静' },
  { emoji: '🌧️', label: '雨天/沮丧', value: '🌧️ 沮丧' },
  { emoji: '⛈️', label: '雷电/焦虑', value: '⛈️ 焦虑' }
]

async function handlePost() {
  if (!content.value.trim()) return
  posting.value = true
  try {
    const res = await store.dispatch('wishTreeHole/postMood', {
      content: content.value.trim(),
      isAnonymous: anonymous.value,
      wishId: selectedWish.value || null,
      moodWeather: weather.value
    })
    if (res.success) {
      ElMessage.success('树洞已发布')
      content.value = ''
      weather.value = ''
      selectedWish.value = null
      emit('posted')
    } else {
      ElMessage.error(res.error || '发布失败')
    }
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    posting.value = false
  }
}

watch(() => props.visible, (v) => {
  if (!v) { content.value = ''; weather.value = ''; selectedWish.value = null }
})
</script>

<style lang="scss" scoped>
.mood-post {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mood-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-label {
  font-size: 13px;
  color: #64748b;
  min-width: 110px;
}

.weather-options {
  display: flex;
  gap: 8px;
}

.weather-item {
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover { background: #f1f5f9; }
  &.active { border-color: #6366f1; background: #eef2ff; }
}

.mask-preview {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .option-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .option-label { min-width: auto; font-size: 12px; }
  .weather-item { font-size: 20px; padding: 2px 6px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .weather-item {
    &:hover { background: #252540; }
    &.active { border-color: #a78bfa; background: #1e2040; }
  }
  .mask-preview { color: #64748b; }
  .el-switch__label { color: #94a3b8; }
}
</style>

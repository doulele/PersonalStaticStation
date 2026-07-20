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
      <el-button @click="emit('update:visible', false)">取消</el-button>
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

  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    color: #0f172a;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: #6366f1;
    }

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }
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
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #6366f1;
    background: #eef2ff;
  }
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
  .weather-item { font-size: 20px; padding: 6px 10px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mood-post {
    :deep(.el-textarea__inner) {
      background: #1e1e2e;
      border-color: #2d2d4a;
      color: #e2dee9;

      &:hover, &:focus {
        border-color: #a78bfa;
      }

      &::placeholder {
        color: #64748b;
      }
    }
  }
  .weather-item {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); }
    &.active { border-color: #a78bfa; background: #252540; }
  }
  .mask-preview { color: #64748b; }
  .el-switch__label { color: #94a3b8; }
}
</style>

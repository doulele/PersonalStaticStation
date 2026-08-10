<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="⚖️ 赎罪任务"
    :width="isMobile ? '92vw' : '420px'"
    :close-on-click-modal="false"
    :show-close="false"
    class="penance-dialog"
  >
    <div v-if="task" class="penance-container">
      <div class="penance-alert">
        <span class="penance-icon">⚠️</span>
        <div>
          <p class="penance-title">「{{ task.title }}」已超时</p>
          <p class="penance-desc">时间税已生效，请先完成赎罪任务来解除封印</p>
        </div>
      </div>

      <div class="penance-task-card">
        <span class="penance-task-icon">🪙</span>
        <div>
          <p class="penance-task-title">{{ task.penanceTask?.title }}</p>
          <p class="penance-task-hint">完成此任务后，原任务将被重新激活</p>
        </div>
      </div>

      <div class="penance-actions">
        <el-button type="primary" size="large" @click="handleComplete" class="penance-btn">
          我已完成赎罪
        </el-button>
        <el-button size="large" @click="handleSkip" class="skip-btn">
          暂不处理
        </el-button>
      </div>

      <p class="penance-note">💡 提示：若赎罪任务也超时，自由币余额将自动扣减</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  task: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'complete'])

function handleComplete() {
  ElMessage.success('赎罪完成！原任务已解除封印 ✅')
  emit('complete')
}

function handleSkip() {
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.penance-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.penance-alert {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}
.penance-icon { font-size: 28px; }
.penance-title { font-size: 15px; font-weight: 600; color: #dc2626; margin: 0 0 4px; }
.penance-desc { font-size: 13px; color: #ef4444; margin: 0; }

.penance-task-card {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #fef3c7, #fffdf0);
  border: 2px solid #d4a843;
  border-radius: 14px;
  align-items: center;
}
.penance-task-icon { font-size: 32px; }
.penance-task-title { font-size: 16px; font-weight: 600; color: #92400e; margin: 0 0 4px; }
.penance-task-hint { font-size: 12px; color: #a16207; margin: 0; }

.penance-actions {
  display: flex;
  gap: 10px;
}
.penance-btn {
  flex: 1;
  background: linear-gradient(135deg, #d4a843, #c9952e);
  border: none;
  &:hover { background: linear-gradient(135deg, #c9952e, #b8861e); }
}
.skip-btn { flex: 1; }

.penance-note {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

html.dark-mode & {
  .penance-alert { background: #2d1a1a; border-color: #7f1d1d; }
  .penance-title { color: #f87171; }
  .penance-desc { color: #ef4444; }
  .penance-task-card { background: #2d2a1a; border-color: #f0c060; }
  .penance-task-title { color: #f0c060; }
  .penance-task-hint { color: #d4a843; }
}

@media (max-width: 768px) {
  .penance-task-card { padding: 14px; }
  .penance-task-icon { font-size: 24px; }
  .penance-task-title { font-size: 14px; }
  .penance-actions { flex-direction: column; }
}
</style>

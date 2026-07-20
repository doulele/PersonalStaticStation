<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="editTask ? '编辑炼金任务' : '创建炼金任务'"
    :width="isMobile ? '92vw' : '520px'"
    :close-on-click-modal="false"
    class="task-form-dialog"
  >
    <el-form :model="form" label-position="top" class="ta-form">
      <!-- 任务标题 -->
      <el-form-item label="任务标题" required>
        <el-input
          v-model="form.title"
          placeholder="例如：写完Q3季度报告、健身30分钟..."
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <!-- 任务描述 -->
      <el-form-item label="详细描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="补充任务细节..."
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- 精力消耗指数 -->
      <el-form-item label="精力消耗指数" required>
        <div class="energy-selector">
          <div
            class="energy-option high"
            :class="{ active: form.energy === 'high' }"
            @click="form.energy = 'high'"
          >
            <span class="energy-icon">⚡</span>
            <div>
              <span class="energy-label">高能耗</span>
              <span class="energy-desc">深度思考·执行力强</span>
            </div>
          </div>
          <div
            class="energy-option low"
            :class="{ active: form.energy === 'low' }"
            @click="form.energy = 'low'"
          >
            <span class="energy-icon">🍃</span>
            <div>
              <span class="energy-label">低能耗</span>
              <span class="energy-desc">机械重复·碎片化</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 专注时长 -->
      <el-form-item label="任务重量（专注时长）">
        <el-radio-group v-model="form.duration">
          <el-radio-button :value="15">15分钟</el-radio-button>
          <el-radio-button :value="30">30分钟</el-radio-button>
          <el-radio-button :value="60">1小时</el-radio-button>
          <el-radio-button :value="120">2小时+</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 重要等级 / 紧急度 -->
      <el-form-item label="优先级">
        <el-radio-group v-model="form.priority">
          <el-radio-button value="urgent">🔴 紧急重要</el-radio-button>
          <el-radio-button value="important">🟡 重要不紧急</el-radio-button>
          <el-radio-button value="normal">🟢 普通</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 截止日期 -->
      <el-form-item label="截止日期">
        <el-date-picker
          v-model="form.deadline"
          type="datetime"
          placeholder="选择截止日期和时间"
          style="width: 100%;"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <!-- 时间税契约 -->
      <el-form-item v-if="form.deadline">
        <el-checkbox v-model="form.timeTax" :true-value="true" :false-value="false">
          开启「时间税」保护罩
          <el-tooltip content="提前完成获得自由币奖励；超时触发赎罪子任务" placement="top">
            <el-icon style="margin-left: 4px; color: #94a3b8;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!canSave">
        {{ editTask ? '保存修改' : '投入炼金炉' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  editTask: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'save'])

const defaultForm = {
  title: '',
  description: '',
  energy: 'high',
  duration: 30,
  priority: 'normal',
  deadline: null,
  timeTax: true
}

const form = ref({ ...defaultForm })

const canSave = computed(() => form.value.title.trim() && form.value.energy)

watch(() => props.editTask, (task) => {
  if (task) {
    form.value = {
      title: task.title || '',
      description: task.description || '',
      energy: task.energy || 'high',
      duration: task.duration || 30,
      priority: task.priority || 'normal',
      deadline: task.deadline || null,
      timeTax: task.timeTax !== false
    }
  }
}, { immediate: true })

watch(() => props.visible, (v) => {
  if (!v) {
    setTimeout(() => { form.value = { ...defaultForm } }, 300)
  }
})

function disabledDate(time) {
  return time.getTime() < Date.now() - 86400000
}

function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入任务标题')
    return
  }
  if (!form.value.energy) {
    ElMessage.warning('请选择精力消耗指数')
    return
  }
  emit('save', {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    energy: form.value.energy,
    duration: form.value.duration,
    priority: form.value.priority,
    deadline: form.value.deadline ? new Date(form.value.deadline).toISOString() : null,
    timeTax: form.value.timeTax
  })
}

function handleCancel() {
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.ta-form {
  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #0f172a;
  }
}

.energy-selector {
  display: flex;
  gap: 12px;
  width: 100%;
}
.energy-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  &.high {
    &:hover, &.active { border-color: #ef4444; background: #fef2f2; }
    .energy-label { color: #dc2626; }
  }
  &.low {
    &:hover, &.active { border-color: #16a34a; background: #f0fdf4; }
    .energy-label { color: #16a34a; }
  }
}
.energy-icon { font-size: 24px; }
.energy-label { font-size: 14px; font-weight: 600; display: block; }
.energy-desc { font-size: 12px; color: #94a3b8; }

html.dark-mode & {
  :deep(.el-form-item__label) { color: #e2dee9; }
  .energy-option {
    border-color: #2d2d4a;
    &.high:hover, &.high.active { background: #2d1a1a; }
    &.low:hover, &.low.active { background: #1a2d1a; }
  }
  .energy-desc { color: #64748b; }
}

// ==================== 移动端弹窗适配 ====================
@media (max-width: 768px) {
  :deep(.el-dialog__body) { padding: 14px !important; }
  :deep(.el-dialog__header) { padding: 14px 14px 10px !important; }
  :deep(.el-dialog__footer) { padding: 10px 14px 14px !important; }
  :deep(.el-radio-button__inner) { padding: 5px 8px; font-size: 12px; }
  .energy-option { padding: 10px 12px; gap: 6px; }
  .energy-icon { font-size: 20px; }
  .energy-label { font-size: 12px; }
}
</style>

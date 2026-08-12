<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="editTask ? '编辑炼金任务' : '创建炼金任务'"
    :width="isMobile ? '92vw' : '560px'"
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
          <div
            class="energy-option medium"
            :class="{ active: form.energy === 'medium' }"
            @click="form.energy = 'medium'"
          >
            <span class="energy-icon">🔥</span>
            <div>
              <span class="energy-label">一般能耗</span>
              <span class="energy-desc">常规工作·需要专注</span>
            </div>
          </div>
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
        </div>
      </el-form-item>

      <!-- 专注时长 -->
      <el-form-item label="任务重量（专注时长）">
        <div class="duration-row">
          <el-radio-group v-model="form.durationPreset" class="duration-presets" @change="onPresetChange">
            <el-radio-button :value="15">15分钟</el-radio-button>
            <el-radio-button :value="30">30分钟</el-radio-button>
            <el-radio-button :value="60">1小时</el-radio-button>
            <el-radio-button :value="120">2小时+</el-radio-button>
            <el-radio-button value="custom">自定义</el-radio-button>
          </el-radio-group>
          <transition name="fade">
            <div v-if="form.durationPreset === 'custom'" class="duration-custom">
              <input
                v-model.number="form.customMinutes"
                type="number"
                min="1"
                max="480"
                step="5"
                class="duration-input"
                placeholder="分钟"
                @input="onCustomChange"
              />
              <span class="duration-custom-unit">分钟</span>
            </div>
          </transition>
        </div>
      </el-form-item>

      <!-- 重要等级 / 紧急度 -->
      <el-form-item label="优先级">
        <el-radio-group v-model="form.priority">
          <el-radio-button value="normal">🟢 普通</el-radio-button>
          <el-radio-button value="important">🟡 重要不紧急</el-radio-button>
          <el-radio-button value="urgent">🔴 紧急重要</el-radio-button>
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
  energy: 'low',
  duration: 30,
  durationPreset: 30,
  customMinutes: 45,
  priority: 'normal',
  deadline: null,
  timeTax: true
}

const form = ref({ ...defaultForm })

const canSave = computed(() => {
  if (!form.value.title.trim() || !form.value.energy) return false
  // 自定义模式下必须有有效分钟数
  if (form.value.durationPreset === 'custom') {
    return form.value.customMinutes >= 1 && form.value.customMinutes <= 480
  }
  return true
})

function resolveDuration() {
  if (form.value.durationPreset === 'custom') {
    return form.value.customMinutes
  }
  return Number(form.value.durationPreset)
}

function onPresetChange(val) {
  if (val !== 'custom') {
    form.value.duration = Number(val)
  } else {
    form.value.duration = form.value.customMinutes
  }
}

function onCustomChange(val) {
  if (form.value.durationPreset === 'custom' && val) {
    form.value.duration = val
  }
}

watch(() => props.editTask, (task) => {
  if (task) {
    const taskDuration = task.duration || 30
    const isPreset = [15, 30, 60, 120].includes(taskDuration)
    form.value = {
      title: task.title || '',
      description: task.description || '',
      energy: task.energy || 'high',
      duration: taskDuration,
      durationPreset: isPreset ? taskDuration : 'custom',
      customMinutes: isPreset ? 45 : taskDuration,
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
  const duration = resolveDuration()
  if (!duration || duration < 1) {
    ElMessage.warning('请填写有效的任务时长')
    return
  }
  emit('save', {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    energy: form.value.energy,
    duration,
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
    font-size: 14px;
  }
}

.energy-selector {
  display: flex;
  gap: 10px;
  width: 100%;
}
.energy-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
  &.high {
    &:hover, &.active { border-color: #ef4444; background: #fef2f2; }
    .energy-label { color: #dc2626; }
  }
  &.medium {
    &:hover, &.active { border-color: #f59e0b; background: #fffbeb; }
    .energy-label { color: #d97706; }
  }
  &.low {
    &:hover, &.active { border-color: #16a34a; background: #f0fdf4; }
    .energy-label { color: #16a34a; }
  }
}
.energy-icon { font-size: 22px; flex-shrink: 0; }
.energy-label { font-size: 13px; font-weight: 600; display: block; }
.energy-desc { font-size: 11px; color: #94a3b8; display: block; margin-top: 2px; }

.duration-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: 100%;
}
.duration-presets {
  flex-wrap: wrap;
  display: flex;
}
.duration-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.duration-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
  &::placeholder { color: #94a3b8; font-weight: 400; }
  &:focus { border-color: #d4a843; box-shadow: 0 0 0 2px rgba(212, 168, 67, 0.15); }
  /* 隐藏原生 number 箭头 */
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  -moz-appearance: textfield;
}
.duration-custom-unit {
  font-size: 13px;
  color: #64748b;
}

// 自定义时长淡入动画
.fade-enter-active { transition: all 0.2s ease-out; }
.fade-leave-active { transition: all 0.15s ease-in; }
.fade-enter-from { opacity: 0; transform: translateX(-8px); }
.fade-leave-to { opacity: 0; transform: translateX(-8px); }

// 暗色模式已迁移到 common.scss 的 .task-form-dialog 块

// ==================== 移动端弹窗适配 ====================
@media (max-width: 768px) {
  :deep(.el-dialog__body) { padding: 14px !important; }
  :deep(.el-dialog__header) { padding: 14px 14px 10px !important; }
  :deep(.el-dialog__footer) { padding: 10px 14px 14px !important; }
  :deep(.el-radio-button__inner) { padding: 5px 8px; font-size: 12px; }
  .energy-selector { gap: 6px; }
  .energy-option { padding: 8px; gap: 6px; flex-direction: column; align-items: flex-start; text-align: left; }
  .energy-icon { font-size: 20px; }
  .energy-label { font-size: 12px; }
  .energy-desc { font-size: 10px; }
  .duration-row { flex-direction: column; align-items: stretch; }
  .duration-presets { width: 100%; }
  :deep(.el-radio-button) { flex: 1; }
}
</style>
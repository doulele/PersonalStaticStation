<template>
  <el-dialog
    :model-value="visible" @update:model-value="(val) => emit('update:visible', val)"
    title="新建愿望"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form :model="form" label-position="top" ref="formRef" :rules="rules" class="wish-form">
      <el-form-item label="愿望标题" prop="title">
        <el-input v-model="form.title" placeholder="你想实现什么愿望？" maxlength="50" show-word-limit size="large" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述一下你的愿望..." />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="分类">
            <el-select v-model="form.category" style="width: 100%">
              <el-option label="生活" value="生活" />
              <el-option label="学习" value="学习" />
              <el-option label="旅行" value="旅行" />
              <el-option label="体验" value="体验" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级">
            <el-radio-group v-model="form.priority" size="small">
              <el-radio-button value="高">高</el-radio-button>
              <el-radio-button value="中">中</el-radio-button>
              <el-radio-button value="低">低</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="目标日期">
        <el-date-picker
          v-model="form.targetDate"
          type="date"
          placeholder="选择期望完成日期"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </el-form-item>

      <el-form-item label="子任务/里程碑">
        <div class="subtask-list" v-if="form.subTasks.length > 0">
          <div v-for="(task, idx) in form.subTasks" :key="idx" class="subtask-card">
            <el-checkbox v-model="task.done" />
            <el-input v-model="task.title" placeholder="子任务名称" size="small" @blur="onSubTaskChange" />
            <el-button text type="danger" @click="removeSubTask(idx)">×</el-button>
          </div>
        </div>
        <el-button size="small" @click="addSubTask" style="margin-top: 8px;">+ 添加子任务</el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">创建愿望</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const props = defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['update:visible', 'saved'])
const store = useStore()

const formRef = ref(null)
const saving = ref(false)

const rules = {
  title: [{ required: true, message: '请输入愿望标题', trigger: 'blur' }]
}

const form = reactive({
  title: '',
  description: '',
  category: '生活',
  priority: '中',
  targetDate: null,
  subTasks: []
})

function disabledDate(time) {
  return time.getTime() < Date.now() - 86400000
}

function addSubTask() {
  form.subTasks.push({ title: '', done: false })
}

function removeSubTask(idx) {
  form.subTasks.splice(idx, 1)
}

function onSubTaskChange() { /* 自动保存 */ }

async function handleSubmit() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      targetDate: form.targetDate instanceof Date
        ? form.targetDate.toISOString().slice(0, 10)
        : form.targetDate,
      subTasks: form.subTasks.length > 0 ? form.subTasks : undefined
    }
    const res = await store.dispatch('wishTreeHole/createWish', data)
    if (res.success) {
      ElMessage.success('愿望已创建！')
      resetForm()
      emit('saved')
    } else {
      ElMessage.error(res.error || '创建失败')
    }
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.category = '生活'
  form.priority = '中'
  form.targetDate = null
  form.subTasks = []
}

// 当 visible 变化时重置表单
watch(() => props.visible, (v) => {
  if (!v) resetForm()
})
</script>

<style lang="scss" scoped>
.wish-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

.subtask-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }
  .el-input {
    flex: 1;
  }
  .el-button {
    font-size: 18px;
    padding: 0 8px;
  }
}

@media (max-width: 768px) {
  .subtask-card {
    flex-wrap: wrap;
    .el-button { margin-left: auto; }
  }
}
</style>

<style lang="scss">
html.dark-mode {
  .subtask-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover {
      border-color: #a78bfa;
      background: #252540;
      box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08);
    }
    .el-input__wrapper { background: #252540; }
    .el-checkbox__inner {
      background: #252540;
      border-color: #2d2d4a;
    }
  }
  .el-dialog {
    background: #1e1e2e;
    border: 1px solid #2d2d4a;
  }
}
</style>

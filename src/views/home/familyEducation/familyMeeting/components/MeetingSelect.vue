<template>
  <div class="meeting-select">
    <el-select
      :model-value="modelValue"
      placeholder="选择会议"
      filterable
      style="flex: 1"
      @update:model-value="onSelect"
    >
      <el-option
        v-for="m in visibleMeetings"
        :key="m.id"
        :value="m.id"
        :label="`${m.title}（${m.date}）`"
      >
        <span>{{ m.title }}</span>
        <el-tag v-if="m.visibility === 'private'" size="small" type="danger" effect="plain">私密</el-tag>
        <el-tag v-if="m.encrypted" size="small" type="warning" effect="plain">加密</el-tag>
      </el-option>
    </el-select>
    <el-button type="primary" @click="dialog = true">新建会议</el-button>

    <el-dialog v-model="dialog" title="新建家庭会议" width="460px" :close-on-click-modal="false" append-to-body>
      <el-form label-position="top">
        <el-form-item label="会议主题" required>
          <el-input v-model="form.title" placeholder="如：周末家庭例会" maxlength="30" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="参与者（限定可见范围）" required>
          <el-select v-model="form.participants" multiple placeholder="选择成员" style="width:100%">
            <el-option v-for="m in members" :key="m.id" :value="m.id" :label="m.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="可见性">
          <el-radio-group v-model="form.visibility">
            <el-radio value="normal">普通（管理员可见全部）</el-radio>
            <el-radio value="private">私密（仅参与者，完全隐藏）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="加密会议">
          <el-switch v-model="form.encrypted" />
          <el-input
            v-if="form.encrypted"
            v-model="form.encryptPass"
            type="password"
            show-password
            placeholder="查看密码"
            style="margin-left:12px; max-width:180px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" :disabled="!canCreate" @click="onCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const store = useStore()
const dialog = ref(false)
const form = ref({ title: '', date: new Date().toISOString().slice(0, 10), participants: [], visibility: 'normal', encrypted: false, encryptPass: '' })

const visibleMeetings = computed(() => store.getters['familyMeeting/visibleMeetings'])
const members = computed(() => store.state.familyMeeting.members)
const canCreate = computed(() => form.value.title && form.value.participants.length > 0)

function onSelect(v) { emit('update:modelValue', v) }

function onCreate() {
  if (!canCreate.value) return
  if (form.value.encrypted && !form.value.encryptPass) {
    ElMessage.warning('加密会议需设置查看密码')
    return
  }
  // 确保自己必定在参与者中
  const parts = form.value.participants.includes(store.state.familyMeeting.currentUserId)
    ? form.value.participants
    : [...form.value.participants, store.state.familyMeeting.currentUserId]
  const m = store.dispatch('familyMeeting/createMeeting', {
    title: form.value.title,
    date: form.value.date,
    participants: parts,
    visibility: form.value.visibility,
    encrypted: form.value.encrypted,
    encryptPass: form.value.encryptPass
  })
  dialog.value = false
  emit('update:modelValue', m.id)
  form.value = { title: '', date: new Date().toISOString().slice(0, 10), participants: [], visibility: 'normal', encrypted: false, encryptPass: '' }
  ElMessage.success('会议已创建')
}
</script>

<style lang="scss" scoped>
.meeting-select {
  display: flex;
  gap: 10px;
  align-items: center;
  .el-select { min-width: 0; }
}

// 移动端弹窗全宽
:deep(.el-dialog) {
  @media (max-width: 520px) {
    width: 92% !important;
    margin-top: 10vh !important;
  }
}

@media (max-width: 480px) {
  .meeting-select {
    flex-direction: column;
    gap: 8px;
    .el-select, .el-button { width: 100%; }
  }
}
</style>

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
        <el-tag v-if="m.encrypted && !isUnlocked(m.id)" size="small" type="warning" effect="plain">🔒 加密</el-tag>
        <el-tag v-if="m.encrypted && isUnlocked(m.id)" size="small" type="success" effect="plain">🔓 已解锁</el-tag>
      </el-option>
    </el-select>
    <el-button type="primary" @click="dialog = true">新建会议</el-button>

    <!-- 新建会议 -->
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
            <el-radio value="normal">普通（仅参与者可见）</el-radio>
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

    <!-- 🔒 加密会议密码验证弹窗 -->
    <el-dialog v-model="unlockDialog" title="🔒 加密会议" width="400px" :close-on-click-modal="false" append-to-body>
      <p style="margin-bottom:12px; color:#475569;">
        会议 "<strong>{{ unlockTargetTitle }}</strong>" 已加密，请输入查看密码：
      </p>
      <el-input
        v-model="unlockPassword"
        type="password"
        show-password
        placeholder="输入密码"
        @keyup.enter="onUnlock"
      />
      <template #footer>
        <el-button @click="unlockDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!unlockPassword" @click="onUnlock">解锁</el-button>
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

// 🔒 加密会议解锁
const unlockDialog = ref(false)
const unlockPassword = ref('')
const unlockTargetId = ref('')

const visibleMeetings = computed(() => store.getters['familyMeeting/visibleMeetings'])
const members = computed(() => store.state.familyMeeting.members)
const canCreate = computed(() => form.value.title && form.value.participants.length > 0)

const unlockTargetTitle = computed(() => {
  const m = store.state.familyMeeting.meetings.find(x => x.id === unlockTargetId.value)
  return m?.title || ''
})

function isUnlocked(id) {
  return store.state.familyMeeting.unlockedMeetings.includes(id)
}

function onSelect(v) {
  // 🔒 检查是否为加密会议且未解锁
  const meeting = store.state.familyMeeting.meetings.find(m => m.id === v)
  if (meeting?.encrypted && !isUnlocked(v)) {
    unlockTargetId.value = v
    unlockPassword.value = ''
    unlockDialog.value = true
    return
  }
  emit('update:modelValue', v)
}

function onUnlock() {
  if (!unlockPassword.value) return
  const success = store.dispatch('familyMeeting/unlockMeeting', {
    meetingId: unlockTargetId.value,
    password: unlockPassword.value
  })
  if (success) {
    ElMessage.success('密码正确，会议已解锁')
    unlockDialog.value = false
    emit('update:modelValue', unlockTargetId.value)
  } else {
    ElMessage.error('密码错误，请重试')
    unlockPassword.value = ''
  }
}

function onCreate() {
  if (!canCreate.value) return
  if (form.value.encrypted && !form.value.encryptPass) {
    ElMessage.warning('加密会议需设置查看密码')
    return
  }
  // 🔒 确保当前登录用户必定在参与者中（store action 也会保证）
  const authUserId = store.state.auth?.user?.userId
  const parts = form.value.participants.includes(authUserId)
    ? form.value.participants
    : [...form.value.participants, authUserId]
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

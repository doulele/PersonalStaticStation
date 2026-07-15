<template>
  <div class="sp-root">
    <h2 class="sp-title">设置</h2>

    <el-card shadow="never" class="sp-card">
      <template #header><span class="card-h">🔐 语音转写设置</span></template>
      <el-form label-position="top">
        <el-form-item label="转写完成后自动删除原始音频">
          <el-switch v-model="settings.autoDeleteAudio" @change="save" />
        </el-form-item>
        <el-form-item label="自定义热词（逗号分隔，用于触发「结论」标签,也用作方言热词表）">
          <el-input v-model="settings.hotwords" type="textarea" :rows="2" placeholder="决定,结论,先搁置,行动项,待定" @input="save" />
        </el-form-item>
        <el-form-item label="转写后端地址（真实部署 faster-whisper 时填写）">
          <el-input v-model="settings.backendUrl" placeholder="http://localhost:8000/whisper" @input="save" />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="sp-card">
      <template #header><span class="card-h">👥 邀请成员</span></template>
      <div class="invite-section">
        <p>分享邀请码给家人，让他们加入你的家庭空间。邀请码可用于创建家庭空间时的「加入已有家庭」入口。</p>
        <div class="invite-code-box" v-if="inviteCode">
          <span class="invite-code">{{ inviteCode }}</span>
          <el-button size="small" type="primary" plain @click="onCopyInvite">📋 复制</el-button>
          <el-button size="small" text @click="onRegenerateInvite">🔄 刷新</el-button>
        </div>
        <div v-else class="invite-empty">
          <p style="color:#94a3b8;">还没有邀请码，点击下方按钮生成</p>
          <el-button type="primary" :loading="inviteLoading" @click="onGenerateInvite">生成邀请码</el-button>
        </div>
        <p v-if="copySuccess" class="copy-tip">✅ 已复制到剪贴板，快分享给家人吧！</p>
      </div>
    </el-card>

    <el-card shadow="never" class="sp-card">
      <template #header><span class="card-h">📦 数据管理</span></template>
      <el-form label-position="top">
        <el-form-item label="导出加密备份（JSON）">
          <el-button @click="onExportBackup">导出备份文件</el-button>
        </el-form-item>
        <el-divider />
        <el-form-item label="危险操作">
          <el-popconfirm title="⚠️ 此操作将永久删除所有家庭会议数据（含音频记录），确定继续？" @confirm="onResetAll">
            <template #reference>
              <el-button type="danger">重置全部数据</el-button>
            </template>
          </el-popconfirm>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="sp-card">
      <template #header><span class="card-h">ℹ️ 关于数据安全</span></template>
      <p>所有数据仅保存在本机浏览器的 localStorage 中，不会上传任何外部服务器。</p>
      <p>语音转写依赖本地部署的 <b>faster-whisper</b>（支持近普通话的河南方言 + 自定义热词表），保证音频数据不出域。</p>
      <p>版本: v1.0 | 数据模型版本: v1</p>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const store = useStore()
const settings = computed({
  get: () => store.state.familyMeeting.settings,
  set: () => {}
})

// 🔗 邀请码
const inviteLoading = ref(false)
const copySuccess = ref(false)
const inviteCode = computed(() => store.state.familyMeeting.family?.inviteCode || '')

function save() {
  store.dispatch('familyMeeting/updateSettings', { ...settings.value })
}

async function onGenerateInvite() {
  inviteLoading.value = true
  try {
    const res = await store.dispatch('familyMeeting/generateInviteCode')
    if (res.success) {
      ElMessage.success('邀请码已生成')
    } else {
      ElMessage.error(res.error || '生成失败')
    }
  } catch (e) {
    ElMessage.error('生成失败')
  } finally {
    inviteLoading.value = false
  }
}

async function onRegenerateInvite() {
  inviteLoading.value = true
  try {
    const res = await store.dispatch('familyMeeting/generateInviteCode')
    if (res.success) {
      ElMessage.success('邀请码已刷新')
    } else {
      ElMessage.error(res.error || '刷新失败')
    }
  } catch (e) {
    ElMessage.error('刷新失败')
  } finally {
    inviteLoading.value = false
  }
}

async function onCopyInvite() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 3000)
  } catch {
    // 降级方案
    const input = document.createElement('input')
    input.value = inviteCode.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 3000)
  }
}

function onExportBackup() {
  try {
    const raw = localStorage.getItem('fm_state_v1')
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `家庭会议备份_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('备份已导出')
  } catch (e) {
    ElMessage.error('备份失败: ' + e.message)
  }
}

function onResetAll() {
  store.dispatch('familyMeeting/resetAll')
  ElMessage.success('所有数据已清除')
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.sp-root { max-width: 680px; }
.sp-title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 20px; letter-spacing: -0.01em; }
.sp-card {
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  :deep(.el-card__header) {
    padding: 18px 22px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) {
    padding: 20px 22px 22px;
  }
  p { color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 8px; }
}
.card-h { font-weight: 700; font-size: 15px; color: #0f172a; }

.invite-section {
  p { margin: 0 0 12px; }
}
.invite-code-box {
  display: flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
  border: 1px dashed #a5b4fc; border-radius: 12px; padding: 16px 18px;
}
.invite-code {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 22px; font-weight: 800; letter-spacing: 3px;
  color: #4f46e5; flex: 1; user-select: all;
}
.invite-empty { text-align: center; padding: 12px 0; p { margin-bottom: 12px; } }
.copy-tip { color: #10b981; font-weight: 600; margin-top: 8px; animation: fadeIn 0.3s ease; }
.leave-hint { color: #94a3b8; font-size: 12px; margin: 6px 0 0; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 768px) {
  .sp-root { max-width: 100%; }
  .sp-title { font-size: 22px; }
  .sp-card {
    border-radius: 14px; margin-bottom: 14px;
    :deep(.el-card__header) { padding: 14px 16px; }
    :deep(.el-card__body) { padding: 16px; }
  }
}

@media (max-width: 480px) {
  .sp-title { font-size: 20px; margin-bottom: 14px; }
  .sp-card {
    border-radius: 12px;
    :deep(.el-card__header) { padding: 12px 14px; }
    :deep(.el-card__body) { padding: 14px; }
    p { font-size: 13px; }
  }
}
</style>

<style lang="scss">
html.dark-mode {
  .sp-title { color: #e2dee9; }
  .sp-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    .el-card__header { border-bottom-color: #252540; background: #212136; }
    p { color: #94a3b8; }
  }
  .card-h { color: #e2dee9; }
  .invite-code-box { background: linear-gradient(135deg, #1e1a2e 0%, #1e1e2e 100%); border-color: #5b4bcf; }
  .invite-code { color: #a78bfa; }
}
</style>

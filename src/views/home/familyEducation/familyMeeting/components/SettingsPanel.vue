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
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const store = useStore()
const settings = computed({
  get: () => store.state.familyMeeting.settings,
  set: () => {}
})

function save() {
  store.dispatch('familyMeeting/updateSettings', { ...settings.value })
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
.sp-root { max-width: 640px; }
.sp-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
.sp-card { border-radius: 14px; margin-bottom: 14px; }
.card-h { font-weight: 700; }

@media (max-width: 768px) {
  .sp-root { max-width: 100%; }
  .sp-title { font-size: 20px; }
  .sp-card { border-radius: 12px; margin-bottom: 12px; }
}

@media (max-width: 480px) {
  .sp-title { font-size: 18px; margin-bottom: 12px; }
  .sp-card { border-radius: 10px; }
}
</style>

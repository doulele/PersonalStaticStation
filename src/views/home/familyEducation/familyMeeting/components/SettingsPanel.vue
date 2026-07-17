<template>
  <div class="sp-root">
    <h2 class="sp-title">设置</h2>

    <!-- 录音偏好 -->
    <el-card shadow="never" class="sp-card">
      <template #header>
        <div class="card-head-row">
          <span class="card-h">🎙️ 录音偏好</span>
          <span class="card-desc">影响智能会议室中的默认行为</span>
        </div>
      </template>
      <div class="sp-form">
        <div class="sp-field">
          <div class="sp-field-label">默认分段间隔</div>
          <div class="sp-field-desc">录音时每隔此时间自动创建新分段并转写</div>
          <el-select v-model="settings.defaultSegmentDuration" @change="save" style="width: 100%">
            <el-option :value="300" label="5 分钟" />
            <el-option :value="600" label="10 分钟" />
            <el-option :value="900" label="15 分钟" />
            <el-option :value="1800" label="30 分钟" />
          </el-select>
        </div>
        <div class="sp-field">
          <div class="sp-field-label">默认录音模式</div>
          <div class="sp-field-desc">进入会议室时默认选中的记录方式</div>
          <div class="mode-options">
            <label class="mode-option" :class="{ active: settings.defaultMode === 'text' }">
              <input type="radio" v-model="settings.defaultMode" value="text" @change="save" />
              <span class="mode-option-icon">✏️</span>
              <span class="mode-option-text">文本记录</span>
            </label>
            <label class="mode-option" :class="{ active: settings.defaultMode === 'voice' }">
              <input type="radio" v-model="settings.defaultMode" value="voice" @change="save" />
              <span class="mode-option-icon">🎤</span>
              <span class="mode-option-text">语音录音</span>
            </label>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 转写设置 -->
    <el-card shadow="never" class="sp-card">
      <template #header>
        <div class="card-head-row">
          <span class="card-h">📝 转写设置</span>
          <span class="card-desc">优化语音转文字的识别效果</span>
        </div>
      </template>
      <div class="sp-form">
        <div class="sp-field">
          <div class="sp-field-label">自定义热词</div>
          <div class="sp-field-desc">逗号分隔的关键词，用于提升方言识别准确率及自动触发「结论」标签</div>
          <el-input
            v-model="settings.hotwords"
            type="textarea"
            :rows="2"
            placeholder="决定,结论,先搁置,行动项,待定"
            @input="save"
          />
        </div>
      </div>
    </el-card>

    <!-- 数据管理 -->
    <el-card shadow="never" class="sp-card">
      <template #header>
        <div class="card-head-row">
          <span class="card-h">📦 数据管理</span>
          <span class="card-desc">备份与重置</span>
        </div>
      </template>
      <div class="sp-form">
        <div class="sp-field">
          <div class="sp-field-label">导出数据备份</div>
          <div class="sp-field-desc">将所有家庭会议数据导出为 JSON 文件，可用于迁移或存档</div>
          <el-button @click="onExportBackup" class="sp-action-btn">
            <el-icon><Download /></el-icon> 导出备份文件
          </el-button>
        </div>
        <div class="sp-divider"></div>
        <div class="sp-field sp-field-danger">
          <div class="sp-field-label">重置全部数据</div>
          <div class="sp-field-desc">此操作将永久删除所有家庭会议数据（会议记录、议题、任务等），不可恢复</div>
          <el-popconfirm
            title="确定要删除所有家庭会议数据吗？此操作不可恢复！"
            confirm-button-text="确认删除"
            cancel-button-text="取消"
            confirm-button-type="danger"
            @confirm="onResetAll"
          >
            <template #reference>
              <el-button type="danger" plain class="sp-action-btn">重置全部数据</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

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
    // 导出完整的快照数据（含所有 localStorage 中的家庭会议数据）
    const fmKeys = Object.keys(localStorage).filter(k => k.startsWith('fm_state_v1'))
    if (!fmKeys.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const backup = {}
    fmKeys.forEach(k => { backup[k] = JSON.parse(localStorage.getItem(k)) })
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
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
  setTimeout(() => { window.location.reload() }, 500)
}
</script>

<style lang="scss" scoped>
.sp-root { max-width: 640px; }

.sp-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 24px;
  letter-spacing: -0.01em;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

// ==================== 卡片 ====================
.sp-card {
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  :deep(.el-card__header) {
    padding: 18px 24px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) {
    padding: 20px 24px 24px;
  }
}

.card-head-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.card-h {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
  white-space: nowrap;
}
.card-desc {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

// ==================== 表单字段 ====================
.sp-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.sp-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0 18px;
  &:last-child { padding-bottom: 0; }
}
.sp-field-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}
.sp-field-desc {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}
.sp-field-danger {
  .sp-field-label { color: #dc2626; }
  .sp-field-desc { color: #94a3b8; }
}
.sp-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0 18px;
}

// ==================== 模式选择器 ====================
.mode-options {
  display: flex;
  gap: 10px;
}
.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid #e8ecf4;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  input { display: none; }
  .mode-option-icon { font-size: 20px; flex-shrink: 0; }
  .mode-option-text { font-size: 13px; font-weight: 600; color: #64748b; }
  &:hover {
    border-color: #c7d2fe;
    background: #fafbff;
    .mode-option-text { color: #475569; }
  }
  &.active {
    border-color: #6366f1;
    background: linear-gradient(135deg, #eef2ff, #f5f3ff);
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.12);
    .mode-option-text { color: #4f46e5; }
  }
}

.sp-action-btn {
  width: fit-content;
  border-radius: 10px;
  font-weight: 600;
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .sp-root { max-width: 100%; }
  .sp-title { font-size: 22px; margin-bottom: 20px; }
  .sp-card {
    border-radius: 14px; margin-bottom: 14px;
    :deep(.el-card__header) { padding: 14px 16px; }
    :deep(.el-card__body) { padding: 16px; }
  }
  .mode-options { flex-direction: column; }
}

@media (max-width: 480px) {
  .sp-title { font-size: 20px; margin-bottom: 16px; }
  .sp-card {
    border-radius: 12px;
    :deep(.el-card__header) { padding: 12px 14px; }
    :deep(.el-card__body) { padding: 14px; }
  }
  .card-head-row { flex-direction: column; gap: 2px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .sp-title {
    background: linear-gradient(135deg, #a78bfa, #c4b5fd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .sp-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
    .el-card__header { border-bottom-color: #252540; background: #212136; }
  }
  .card-h { color: #e2dee9; }
  .card-desc { color: #64748b; }
  .sp-field-label { color: #cbd5e1; }
  .sp-field-desc { color: #64748b; }
  .sp-field-danger .sp-field-label { color: #f87171; }
  .sp-divider { background: #252540; }
  .mode-option {
    background: #252540; border-color: #2d2d4a;
    .mode-option-text { color: #94a3b8; }
    &:hover { border-color: #5b4bcf; background: #212145; .mode-option-text { color: #cbd5e1; } }
    &.active {
      border-color: #a78bfa;
      background: linear-gradient(135deg, #1e1a2e, #242045);
      .mode-option-text { color: #c4b5fd; }
    }
  }
}
</style>

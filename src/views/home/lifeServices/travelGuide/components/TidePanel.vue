<template>
  <!-- 潮汐入口卡片 -->
  <div class="tide-entry-card" @click="showDialog = true">
    <div class="tide-entry-wave">
      <span class="wave-emoji">🌊</span>
      <span class="wave-ring"></span>
    </div>
    <div class="tide-entry-body">
      <div class="tide-entry-title">潮汐预报</div>
      <div class="tide-entry-desc">
        {{ entryDesc }}
      </div>
    </div>
    <div class="tide-entry-arrow">
      <el-icon :size="18"><ArrowRight /></el-icon>
    </div>
  </div>

  <!-- 潮汐弹窗 -->
  <el-dialog
    v-model="showDialog"
    :width="dialogWidth"
    :close-on-click-modal="false"
    destroy-on-close
    class="tide-dialog"
  >
    <template #header>
      <div class="tide-dialog-header">
        <span class="tide-dialog-header-icon">🌊</span>
        <span class="tide-dialog-header-title">潮汐预报</span>
        <el-tag v-if="locationName" size="small" type="primary" effect="plain" round>{{ locationName }}</el-tag>
        <el-tag v-if="tideData?.date" size="small" effect="plain" round>{{ tideData.date }}</el-tag>
      </div>
    </template>
    <TideTable :dialog-mode="true" :location-name="locationName" />
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ArrowRight } from '@element-plus/icons-vue'
import TideTable from '../result/components/TideTable.vue'

const props = defineProps({
  locationName: {
    type: String,
    default: ''
  }
})

const store = useStore()
const showDialog = ref(false)

const tideData = computed(() => store.state.plan.tideData)

const entryDesc = computed(() => {
  if (tideData.value) {
    const parts = [props.locationName, tideData.value.date, tideData.value.moonPhase].filter(Boolean)
    return parts.join(' · ')
  }
  return `${props.locationName || ''} — 点击查看潮位变化和游玩建议`
})

const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '680px'
  return window.innerWidth < 768 ? '92%' : '680px'
})
</script>

<style lang="scss" scoped>
// ========== 入口卡片 ==========
.tide-entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #eef2ff, #eff6ff);
  border: 1px solid #c7d2fe;
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    border-color: #818cf8;
    box-shadow: 0 4px 18px rgba(99, 102, 241, 0.12);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
}

.tide-entry-wave {
  position: relative;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 12px;
}
.wave-emoji { font-size: 22px; position: relative; z-index: 1; }
.wave-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.18);
  animation: wave-ripple 2.5s ease-in-out infinite;
}
@keyframes wave-ripple {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0; }
}

.tide-entry-body {
  flex: 1; min-width: 0;
}
.tide-entry-title {
  font-size: 15px; font-weight: 700; color: #3730a3; margin-bottom: 2px;
}
.tide-entry-desc {
  font-size: 12px; color: #64748b;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.tide-entry-arrow {
  color: #a5b4fc; flex-shrink: 0;
  transition: transform 0.3s;
  .tide-entry-card:hover & { transform: translateX(3px); color: #6366f1; }
}

// ========== 弹窗 ==========
.tide-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    max-height: 90vh;
  }
  :deep(.el-dialog__header) {
    padding: 18px 24px 14px;
    margin: 0;
    border-bottom: 1px solid #f1f5f9;
  }
  :deep(.el-dialog__body) {
    padding: 0;
    overflow-y: auto;
    max-height: calc(90vh - 70px);
  }
  :deep(.el-dialog__close) {
    top: 18px; right: 20px;
    font-size: 20px; color: #94a3b8;
    &:hover { color: #64748b; background: #f1f5f9; border-radius: 8px; }
  }
}

.tide-dialog-header {
  display: flex; align-items: center; gap: 10px;
}
.tide-dialog-header-icon { font-size: 22px; }
.tide-dialog-header-title {
  font-size: 18px; font-weight: 700; color: #0f172a;
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .tide-entry-card {
    padding: 10px 12px; gap: 10px;
    border-radius: 12px;
  }
  .tide-entry-wave { width: 36px; height: 36px; border-radius: 10px; }
  .wave-emoji { font-size: 18px; }
  .tide-entry-title { font-size: 13px; }
  .tide-entry-desc { font-size: 11px; }

  .tide-dialog {
    :deep(.el-dialog) { border-radius: 16px; margin: 0 8px !important; }
    :deep(.el-dialog__header) { padding: 14px 16px 10px; }
    :deep(.el-dialog__body) { max-height: calc(85vh - 60px); }
    :deep(.el-dialog__close) { top: 14px; right: 14px; }
  }
  .tide-dialog-header-title { font-size: 16px; }
}
</style>

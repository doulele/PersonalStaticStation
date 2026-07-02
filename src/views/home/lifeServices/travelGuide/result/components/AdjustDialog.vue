<template>
  <el-dialog
    v-model="showDialog"
    title="⏰ 行程调整建议"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="adjust-body">
      <div class="adjust-info">
        <el-icon :size="18" color="#f59e0b"><Warning /></el-icon>
        <span>打卡时间与计划偏差超过30分钟，建议调整后续行程</span>
      </div>
      <div v-if="warnings.length" class="adjust-warnings">
        <div v-for="(w, i) in warnings.slice(0, 5)" :key="i" class="warning-item">
          ⚠️ {{ w }}
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleSkip">暂不调整</el-button>
      <el-button type="primary" @click="handleAdjust" :loading="loading">自动调整</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useStore } from 'vuex'

const props = defineProps({ modelValue: Boolean, warnings: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue', 'adjusted'])

const store = useStore()
const loading = ref(false)

const showDialog = ref(false)
watch(() => props.modelValue, (val) => { showDialog.value = val })
watch(showDialog, (val) => { emit('update:modelValue', val) })

function handleSkip() {
  showDialog.value = false
  store.commit('plan/SET_NEED_ADJUST', false)
  store.commit('plan/SET_ADJUST_WARNINGS', [])
}

async function handleAdjust() {
  loading.value = true
  try {
    // 找到当前天已确认的节点索引
    const dayNodes = store.state.plan.timelineNodes.filter(n => (n.day || 1) === store.state.plan.currentDay)
    const lastCheckedIdx = dayNodes.findLastIndex ? dayNodes.findLastIndex(n => n.state === 'checked') : [...dayNodes].reverse().findIndex(n => n.state === 'checked')
    const idx = lastCheckedIdx === -1 ? 0 : dayNodes.findLastIndex ? lastCheckedIdx : dayNodes.length - 1 - lastCheckedIdx

    await store.dispatch('plan/adjustTimeline', {
      lastCheckedNodeIndex: Math.max(0, idx),
      actualTimeOffset: -35 // 假设迟到35分钟
    })
    showDialog.value = false
    ElMessage.success('行程已自动调整')
    emit('adjusted')
  } catch (err) {
    ElMessage.error(err.message || '调整失败')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.adjust-body { display: flex; flex-direction: column; gap: 14px; }
.adjust-info {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: #fef3c7; border-radius: 10px;
  font-size: 13px; color: #92400e; line-height: 1.5;
}
.adjust-warnings { display: flex; flex-direction: column; gap: 8px; }
.warning-item {
  padding: 8px 12px; background: #fef2f2; border-radius: 8px;
  font-size: 12px; color: #dc2626;
}
</style>

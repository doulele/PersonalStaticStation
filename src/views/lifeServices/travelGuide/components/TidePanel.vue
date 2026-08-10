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

<style lang="scss" scoped src="./TidePanel.scss"></style>

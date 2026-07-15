<template>
  <div class="wth-page" v-loading="loading">
    <!-- 未加入家庭：引导前往家庭成员管理 -->
    <EmptyFamilyState v-if="!hasFamily && !loading" feature-name="愿望清单 & 家庭树洞" />

    <!-- 有家庭：显示主界面 -->
    <template v-else>
      <!-- 页面头部 -->
      <div class="wth-header">
        <div class="wth-header-left">
          <h1 class="wth-title">🏡 {{ family?.name }}</h1>
          <p class="wth-subtitle">愿望清单 & 家庭树洞</p>
        </div>
        <div class="wth-header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-button circle :icon="Bell" @click="showNotifications = true" />
          </el-badge>
          <el-button circle :icon="DataAnalysis" @click="showStats = true" />
        </div>
      </div>

      <!-- Tab 导航 -->
      <div class="wth-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="wth-tab"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="wth-content">
        <!-- 愿望清单 Tab -->
        <WishList v-if="activeTab === 'wishes'" @detail="openWishDetail" />

        <!-- 树洞 Tab -->
        <TreeHoleStream v-if="activeTab === 'treehole'" @convert="handleConvertMood" />

        <!-- 家庭圈 Tab -->
        <FamilyCircle v-if="activeTab === 'circle'" @pat="handlePat" />
      </div>

      <!-- 创建愿望 FAB -->
      <div class="wth-fab" v-if="activeTab === 'wishes'" @click="showWishForm = true">
        <el-icon :size="24"><Plus /></el-icon>
      </div>

      <!-- 发布树洞 FAB -->
      <div class="wth-fab treehole-fab" v-if="activeTab === 'treehole'" @click="showMoodPost = true">
        <el-icon :size="24"><EditPen /></el-icon>
      </div>
    </template>

    <!-- 弹窗/抽屉 -->
    <WishForm v-model:visible="showWishForm" @saved="onWishSaved" />
    <WishDetail v-model:visible="showWishDetail" :wish-id="detailWishId" @pat="handlePat" />
    <TreeHolePost v-model:visible="showMoodPost" @posted="onMoodPosted" />
    <NotificationPanel v-model:visible="showNotifications" />
    <StatsPanel v-model:visible="showStats" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { Bell, DataAnalysis, Plus, EditPen, List, ChatLineRound, Connection } from '@element-plus/icons-vue'
import WishList from './components/WishList.vue'
import WishForm from './components/WishForm.vue'
import WishDetail from './components/WishDetail.vue'
import TreeHoleStream from './components/TreeHoleStream.vue'
import TreeHolePost from './components/TreeHolePost.vue'
import FamilyCircle from './components/FamilyCircle.vue'
import NotificationPanel from './components/NotificationPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import EmptyFamilyState from '../components/EmptyFamilyState.vue'

const store = useStore()

// 🏠 家庭空间从共享 familyMeeting store 读取
const family = computed(() => store.getters['wishTreeHole/family'])
const hasFamily = computed(() => store.getters['wishTreeHole/hasFamily'])
const loading = computed(() => store.state.wishTreeHole.loading)
const activeTab = computed(() => store.state.wishTreeHole.activeTab)
const unreadCount = computed(() => store.state.wishTreeHole.unreadCount)

const tabs = [
  { key: 'wishes', label: '愿望清单', icon: List },
  { key: 'treehole', label: '家庭树洞', icon: ChatLineRound },
  { key: 'circle', label: '家庭圈', icon: Connection }
]

// UI状态
const showWishForm = ref(false)
const showWishDetail = ref(false)
const showMoodPost = ref(false)
const showNotifications = ref(false)
const showStats = ref(false)
const detailWishId = ref(null)

// 切换Tab
function switchTab(key) {
  store.commit('wishTreeHole/SET_ACTIVE_TAB', key)
  if (key === 'wishes') store.dispatch('wishTreeHole/loadWishes')
  if (key === 'treehole') store.dispatch('wishTreeHole/loadMoods')
}

// 事件处理
function onWishSaved() {
  showWishForm.value = false
  store.dispatch('wishTreeHole/loadWishes')
}
function openWishDetail(id) {
  detailWishId.value = id
  showWishDetail.value = true
  store.dispatch('wishTreeHole/loadWishDetail', id)
}
function onMoodPosted() {
  showMoodPost.value = false
  store.dispatch('wishTreeHole/loadMoods')
}
async function handleConvertMood(id) {
  const res = await store.dispatch('wishTreeHole/convertMoodToWish', id)
  if (res.success) {
    // 可以提示用户
  }
}
async function handlePat({ userId, targetType, targetId, message }) {
  await store.dispatch('wishTreeHole/patUser', { toUserId: userId, targetType, targetId, message })
}

// 初始化 — 先确保共享家庭空间已加载
onMounted(async () => {
  if (!store.state.familyMeeting._initialized) {
    await store.dispatch('familyMeeting/initFromBackend')
  }
  // 🔒 安全校验：如果存在家庭数据，但当前用户不在成员列表中，说明数据异常
  const hasFamily = store.getters['familyMeeting/hasFamily']
  const currentUser = store.getters['familyMeeting/currentUser']
  if (hasFamily && !currentUser) {
    console.warn('[wishTreeHole] 数据异常：当前用户不在家庭成员列表中，强制重置')
    await store.dispatch('familyMeeting/resetAll')
    location.reload()
  }
  // 愿望清单数据依赖于家庭空间
  if (store.getters['familyMeeting/hasFamily']) {
    store.dispatch('wishTreeHole/init')
  }
})
</script>

<style lang="scss" scoped>
.wth-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.wth-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.wth-header-left {
  .wth-title {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px;
  }
  .wth-subtitle {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

.wth-header-right {
  display: flex;
  gap: 8px;
}

// Tabs
.wth-tabs {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
}

.wth-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover { color: #0f172a; }

  &.active {
    background: #fff;
    color: #6366f1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
}

.wth-content {
  min-height: 400px;
}

// FAB
.wth-fab {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
  transition: all 0.3s ease;
  z-index: 100;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
  }
  &:active {
    transform: scale(0.95);
  }

  &.treehole-fab {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
    &:hover {
      box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .wth-page { padding: 12px 12px 80px; }
  .wth-header {
    flex-direction: column;
    gap: 12px;
  }
  .wth-header-left .wth-title { font-size: 22px; }
  .wth-header-right {
    align-self: flex-end;
  }
  .wth-tabs {
    position: sticky;
    top: 0;
    z-index: 50;
    border-radius: 10px;
    margin-bottom: 16px;
  }
  .wth-tab {
    padding: 8px 10px;
    font-size: 13px;
    gap: 4px;
  }
  .wth-fab {
    bottom: 20px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
}

@media (max-width: 480px) {
  .wth-page { padding: 8px 8px 72px; }
  .wth-tab span {
    display: none; // 仅显示图标
  }
}
</style>

<style lang="scss">
html.dark-mode {
  // 页面级别
  .wth-page { background: transparent; }
  .wth-header-left {
    .wth-title { color: #e2dee9; }
    .wth-subtitle { color: #94a3b8; }
  }
  .wth-tabs {
    background: #1e1e3a;
  }
  .wth-tab {
    color: #94a3b8;
    &:hover { color: #e2dee9; }
    &.active {
      background: #2d2d4a;
      color: #a78bfa;
    }
  }

  // ====== Element Plus 全局覆盖（影响 el-dialog / el-drawer 等弹窗组件） ======

  // 对话框
  .el-dialog {
    background: #1e1e2e;
    border: 1px solid #2d2d4a;
    .el-dialog__header { border-bottom: 1px solid #2d2d4a; }
    .el-dialog__title { color: #e2dee9; font-weight: 700; }
    .el-dialog__headerbtn .el-dialog__close { color: #94a3b8; &:hover { color: #e2dee9; } }
    .el-dialog__footer { border-top: 1px solid #2d2d4a; }
  }

  // 抽屉
  .el-drawer {
    background: #1e1e2e;
    .el-drawer__header { border-bottom: 1px solid #2d2d4a; margin-bottom: 0; }
    .el-drawer__title { color: #e2dee9; font-weight: 700; }
    .el-drawer__close-btn { color: #94a3b8; &:hover { color: #e2dee9; } }
    .el-drawer__body { padding: 20px; }
  }

  // 表单
  .el-form-item__label { color: #94a3b8 !important; }
  .el-input__wrapper {
    background: #252540;
    box-shadow: 0 0 0 1px #2d2d4a inset;
    .el-input__inner { color: #e2dee9; &::placeholder { color: #64748b; } }
  }
  .el-input__wrapper:hover { box-shadow: 0 0 0 1px #a78bfa inset; }
  .el-input__wrapper.is-focus { box-shadow: 0 0 0 1px #a78bfa inset; }
  .el-textarea__inner {
    background: #252540;
    border-color: #2d2d4a;
    color: #e2dee9;
    &::placeholder { color: #64748b; }
    &:focus { border-color: #a78bfa; }
  }

  // 选择器
  .el-select .el-input__wrapper { background: #252540; }
  .el-select__popper {
    background: #1e1e2e;
    border: 1px solid #2d2d4a;
    .el-select-dropdown__item {
      color: #e2dee9;
      &.hover, &:hover { background: #252540; }
      &.selected { color: #a78bfa; font-weight: 600; }
    }
  }

  // 日期选择器
  .el-date-editor .el-input__wrapper { background: #252540; }
  .el-picker-panel {
    background: #1e1e2e;
    border: 1px solid #2d2d4a;
    color: #e2dee9;
    .el-date-picker__header-label { color: #e2dee9; &:hover { color: #a78bfa; } }
    .el-picker-panel__icon-btn { color: #94a3b8; &:hover { color: #a78bfa; } }
    .el-date-table th { color: #94a3b8; border-bottom: 1px solid #2d2d4a; }
    td.available { color: #e2dee9; &:hover { color: #a78bfa; } }
    td.disabled .cell { background: #252540; color: #64748b; }
    td.today .cell { color: #a78bfa; font-weight: 700; }
    td.current:not(.disabled) .cell { background: #6366f1; color: #fff; }
    td.next-month, td.prev-month { color: #64748b; }
  }

  // 单选框组
  .el-radio-button__inner {
    background: #252540;
    border-color: #2d2d4a;
    color: #94a3b8;
    &:hover { color: #a78bfa; }
  }
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background: #6366f1;
    border-color: #6366f1;
    color: #fff;
    box-shadow: -1px 0 0 0 #6366f1;
  }

  // 进度条
  .el-progress-bar__outer { background: #2d2d4a; }
  .el-progress__text { color: #94a3b8 !important; }

  // 标签
  .el-tag { border-color: #2d2d4a; }
  .el-tag--plain { background: #252540; color: #94a3b8; }

  // 开关
  .el-switch__label { color: #94a3b8; }
  .el-switch__label.is-active { color: #a78bfa; }

  // 复选框
  .el-checkbox__label { color: #94a3b8; }
  .el-checkbox__inner {
    background: #252540;
    border-color: #2d2d4a;
  }

  // 消息弹窗
  .el-message-box {
    background: #1e1e2e;
    border: 1px solid #2d2d4a;
    .el-message-box__title { color: #e2dee9; }
    .el-message-box__message { color: #94a3b8; }
    .el-message-box__headerbtn .el-message-box__close { color: #94a3b8; }
  }

  // Tabs（Element Plus 内部的）
  .el-tabs__header { border-bottom-color: #2d2d4a; }
  .el-tabs__item {
    color: #94a3b8;
    &:hover { color: #a78bfa; }
    &.is-active { color: #a78bfa; }
  }
  .el-tabs__active-bar { background: #a78bfa; }
  .el-tabs__nav-wrap::after { background: #2d2d4a; }

  // 空状态/loading
  .el-loading-mask { background: rgba(30, 30, 46, 0.85); }
}

// ====== 移动端弹窗自适应 ======
@media (max-width: 768px) {
  .el-dialog {
    width: 92vw !important;
    max-width: 92vw !important;
    border-radius: 16px 16px 0 0 !important;
    margin-top: 10vh !important;
    .el-dialog__body { padding: 16px; }
    .el-dialog__header { padding: 16px 16px 12px; }
    .el-dialog__footer { padding: 12px 16px 16px; }
  }
  .el-drawer {
    width: 92vw !important;
    border-radius: 16px 0 0 16px;
  }
  .el-message-box {
    width: 88vw !important;
    max-width: 88vw !important;
  }
  .el-select__popper,
  .el-picker-panel {
    max-width: 92vw !important;
  }
}
</style>

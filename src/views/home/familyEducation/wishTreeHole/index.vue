<template>
  <div class="wth-page" v-loading="loading">
    <!-- 未加入家庭：引导前往家庭成员管理 -->
    <EmptyFamilyState v-if="!hasFamily && !loading" feature-name="愿望清单 & 家庭树洞" />

    <!-- 有家庭：显示主界面 -->
    <template v-else>
      <!-- 返回按钮 -->
      <div class="back-bar">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
      </div>

      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">{{ family?.name || '愿望清单 & 家庭树洞' }}</h1>
        <p class="page-desc">全家一起追逐愿望，匿名分享心情</p>
      </div>

      <!-- Tab 导航 -->
      <div class="wth-tabs">
        <div class="wth-tabs-inner">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="wth-tab"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
          </div>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="wth-action-bar">
        <div class="wth-action-left">
          <el-button v-if="activeTab === 'treehole'" type="primary" text @click="showMoodPost = true">
            <span>发布树洞</span>
          </el-button>
          <el-button v-if="activeTab === 'wishes'" type="primary" text @click="showWishForm = true">
            <span>新建愿望</span>
          </el-button>
        </div>
        <div class="wth-action-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-button text @click="openNotifications">
              <span>消息中心</span>
            </el-button>
          </el-badge>
          <el-button text @click="showStats = true">
            <span>数据统计</span>
          </el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-card">
        <div class="wth-content">
          <!-- 愿望清单 Tab -->
          <WishList v-if="activeTab === 'wishes'" @detail="openWishDetail" />

          <!-- 树洞 Tab -->
          <TreeHoleStream v-if="activeTab === 'treehole'" @convert="handleConvertMood" />

          <!-- 家庭圈 Tab -->
          <FamilyCircle v-if="activeTab === 'circle'" @pat="handlePat" />
        </div>
      </div>
    </template>

    <!-- 弹窗/抽屉 -->
    <WishForm v-model:visible="showWishForm" @saved="onWishSaved" />
    <WishDetail v-model:visible="showWishDetail" :wish-id="detailWishId" @pat="handlePat" />
    <TreeHolePost v-model:visible="showMoodPost" @posted="onMoodPosted" />
    <NotificationPanel v-model:visible="showNotifications" :direction="isMobile ? 'btt' : 'rtl'" />
    <StatsPanel v-model:visible="showStats" :direction="isMobile ? 'btt' : 'rtl'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { Bell, DataAnalysis, Plus, EditPen, List, ChatLineRound, Connection, ArrowLeft } from '@element-plus/icons-vue'
import WishList from './components/WishList.vue'
import WishForm from './components/WishForm.vue'
import WishDetail from './components/WishDetail.vue'
import TreeHoleStream from './components/TreeHoleStream.vue'
import TreeHolePost from './components/TreeHolePost.vue'
import FamilyCircle from './components/FamilyCircle.vue'
import NotificationPanel from './components/NotificationPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import EmptyFamilyState from '../components/EmptyFamilyState.vue'

import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()

// 🏠 家庭空间从共享 familyMeeting store 读取
const family = computed(() => store.getters['wishTreeHole/family'])
const hasFamily = computed(() => store.getters['wishTreeHole/hasFamily'])
const loading = computed(() => store.state.wishTreeHole.loading)
const activeTab = computed(() => store.state.wishTreeHole.activeTab)
const unreadCount = computed(() => store.state.wishTreeHole.unreadCount)

const tabs = [
  { key: 'treehole', label: '家庭树洞', icon: ChatLineRound },
  { key: 'wishes', label: '愿望清单', icon: List },
  { key: 'circle', label: '家庭圈', icon: Connection }
]

// UI状态
const showWishForm = ref(false)
const showWishDetail = ref(false)
const showMoodPost = ref(false)
const showNotifications = ref(false)
const showStats = ref(false)
const detailWishId = ref(null)
const isMobile = ref(window.innerWidth < 768)

function onResize() {
  isMobile.value = window.innerWidth < 768
}

// 切换Tab
function switchTab(key) {
  store.commit('wishTreeHole/SET_ACTIVE_TAB', key)
  if (key === 'wishes') store.dispatch('wishTreeHole/loadWishes')
  if (key === 'treehole') store.dispatch('wishTreeHole/loadMoods')
  store.dispatch('wishTreeHole/fetchUnreadCount')
}

function openNotifications() {
  store.dispatch('wishTreeHole/loadNotifications')
  showNotifications.value = true
}

// 返回上一页
function goBack() {
  router.back()
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
  window.addEventListener('resize', onResize)
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

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<style lang="scss" scoped>
.wth-page {
  padding: 40px 32px;
  max-width: 1200px;
  width: 80%;
  margin: 0 auto;
  box-sizing: border-box;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// ==================== 返回按钮 ====================
.back-bar {
  margin-bottom: 16px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  &:hover { color: #6366f1; background: #f1f5f9; }
}

// Page Header — 居中风格，参考 familyEducation/index.vue
.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

// Tabs
.wth-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
  gap: 8px;
}

.wth-tabs-inner {
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

// ==================== 操作栏 ====================
.wth-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}

.wth-action-left,
.wth-action-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.wth-action-left {
  :deep(.el-button) {
    font-size: 14px;
    color: #6366f1;
    &:hover { background: #eef2ff; }
  }
}

.wth-action-right {
  :deep(.el-button) {
    font-size: 13px;
    color: #64748b;
    &:hover { color: #6366f1; background: #f1f5f9; }
  }
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

.content-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 768px) {
  .wth-page {
    padding: 16px 12px 80px;
    width: 100%;
    max-width: 100%;
  }
  .back-bar { margin-bottom: 8px; }
  .page-header { margin-bottom: 20px; }
  .page-title { font-size: 22px; }
  .page-desc { font-size: 13px; }
  .wth-tabs {
    position: sticky;
    top: 0;
    z-index: 50;
    border-radius: 10px;
    margin-bottom: 10px;
    padding: 3px;
  }
  .wth-tab {
    padding: 9px 8px;
    font-size: 13px;
    border-radius: 8px;
  }
  .wth-action-bar {
    margin-bottom: 10px;
    padding: 0;
  }
  .wth-action-left :deep(.el-button) {
    font-size: 13px;
    padding: 4px 8px;
  }
  .wth-action-right :deep(.el-button) {
    font-size: 13px;
    padding: 4px 6px;
  }
  .content-card {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
  }
}

@media (max-width: 480px) {
  .wth-page { padding: 12px 10px 72px; }
  .page-header { margin-bottom: 16px; }
  .page-title { font-size: 20px; }
  .page-desc { font-size: 12px; }
  .wth-tab { font-size: 12px; padding: 8px 4px; }
  .wth-action-left :deep(.el-button) { font-size: 12px; padding: 4px 6px; }
  .wth-action-right :deep(.el-button) { font-size: 12px; padding: 4px 4px; }
}
</style>

<style lang="scss">
html.dark-mode {
  // 页面级别
  .wth-page { background: transparent; }
  .back-btn {
    color: #94a3b8;
    &:hover { color: #a78bfa; background: #252540; }
  }
  .page-title { color: #e2dee9; }
  .page-desc { color: #94a3b8; }
  .wth-tabs {
    background: #252540;
  }
  .wth-tab {
    color: #94a3b8;
    &:hover { color: #e2dee9; }
    &.active {
      background: #2d2d4a;
      color: #a78bfa;
    }
  }
  .content-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
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
    border-radius: 16px 16px 0 0;
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

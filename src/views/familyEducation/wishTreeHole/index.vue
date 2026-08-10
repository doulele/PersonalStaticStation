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
          <WishList v-if="activeTab === 'wishes'" @detail="openWishDetail" @pat="handlePat" />

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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
  console.log('[index] handlePat received', { userId, targetType, targetId, message })
  try {
    const res = await store.dispatch('wishTreeHole/patUser', { toUserId: userId, targetType, targetId, message })
    console.log('[index] patUser API response', res)
    if (res && res.success) {
      ElMessage.success('👋 ' + (message || '已发送拍一拍'))
    } else {
      ElMessage.error(res?.error || '发送失败')
    }
  } catch (err) {
    console.error('[index] patUser error', err)
    ElMessage.error('网络错误，请重试')
  }
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

<style lang="scss" scoped src="./index.scss"></style>
<style lang="scss" src="./index-global.scss"></style>

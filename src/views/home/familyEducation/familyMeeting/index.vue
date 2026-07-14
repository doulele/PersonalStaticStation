<template>
  <div class="fm-root">
    <!-- 加载中 -->
    <div v-if="loading" class="fm-loading">
      <el-icon class="fm-loading-icon" :size="48"><Loading /></el-icon>
      <p>正在加载家庭会议数据…</p>
    </div>

    <!-- 未初始化家庭空间：引导创建 -->
    <SpaceSetup v-else-if="!hasFamily" />

    <!-- 已初始化：主面板 -->
    <el-container v-else class="fm-shell">
      <!-- 桌面端侧边栏 -->
      <el-aside width="220px" class="fm-aside fm-aside-desk">
        <div class="fm-brand">
          <el-icon :size="22"><ChatDotRound /></el-icon>
          <span>家庭会议</span>
        </div>
        <el-menu :default-active="active" class="fm-menu" @select="onNav">
          <el-menu-item index="agenda">
            <el-icon><EditPen /></el-icon><span>议题与议程</span>
          </el-menu-item>
          <el-menu-item index="room">
            <el-icon><Microphone /></el-icon><span>智能会议室</span>
          </el-menu-item>
          <el-menu-item index="wall">
            <el-icon><Picture /></el-icon><span>记忆墙</span>
          </el-menu-item>
          <el-menu-item index="decision">
            <el-icon><List /></el-icon><span>决策追踪</span>
          </el-menu-item>
          <el-menu-item index="report">
            <el-icon><DataLine /></el-icon><span>年度情感报告</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon><span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 移动端抽屉侧边栏 -->
      <el-drawer
        v-model="drawerOpen"
        direction="ltr"
        size="260px"
        :with-header="false"
        class="fm-drawer"
        :close-on-press-escape="true"
        :show-close="false"
      >
        <div class="fm-drawer-brand">
          <el-icon :size="22"><ChatDotRound /></el-icon>
          <span>家庭会议</span>
        </div>
        <el-menu :default-active="active" class="fm-menu fm-menu-mobile" @select="onNav">
          <el-menu-item index="agenda">
            <el-icon><EditPen /></el-icon><span>议题与议程</span>
          </el-menu-item>
          <el-menu-item index="room">
            <el-icon><Microphone /></el-icon><span>智能会议室</span>
          </el-menu-item>
          <el-menu-item index="wall">
            <el-icon><Picture /></el-icon><span>记忆墙</span>
          </el-menu-item>
          <el-menu-item index="decision">
            <el-icon><List /></el-icon><span>决策追踪</span>
          </el-menu-item>
          <el-menu-item index="report">
            <el-icon><DataLine /></el-icon><span>年度情感报告</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon><span>设置</span>
          </el-menu-item>
        </el-menu>
      </el-drawer>

      <el-container>
        <el-header class="fm-header">
          <!-- 移动端汉堡按钮 -->
          <el-button class="fm-hamburger" link @click="drawerOpen = true">
            <el-icon :size="22"><Expand /></el-icon>
          </el-button>
          <div class="fm-fam">
            <span class="fm-fam-name">{{ family?.name }}</span>
            <el-tag size="small" :type="syncTagType" effect="plain">{{ syncLabel }}</el-tag>
          </div>
          <div class="fm-user">
            <span class="fm-user-label">当前身份</span>
            <el-tag size="small" type="primary" effect="plain">
              {{ authUserName }}
            </el-tag>
          </div>
        </el-header>

        <el-main class="fm-main">
          <AgendaBoard v-show="active === 'agenda'" />
          <MeetingRoom v-show="active === 'room'" />
          <MemoryWall v-show="active === 'wall'" />
          <DecisionBoard v-show="active === 'decision'" />
          <AnnualReport v-show="active === 'report'" />
          <SettingsPanel v-show="active === 'settings'" />
        </el-main>

        <!-- 移动端底部导航栏 -->
        <div class="fm-bottom-nav">
          <div
            v-for="tab in bottomTabs"
            :key="tab.key"
            class="bn-item"
            :class="{ active: active === tab.key }"
            @click="onNav(tab.key)"
          >
            <el-icon :size="20"><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </div>
        </div>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import {
  ChatDotRound, EditPen, Microphone, Picture, List, DataLine, Setting, Loading, Expand
} from '@element-plus/icons-vue'
import SpaceSetup from './components/SpaceSetup.vue'
import AgendaBoard from './components/AgendaBoard.vue'
import MeetingRoom from './components/MeetingRoom.vue'
import MemoryWall from './components/MemoryWall.vue'
import DecisionBoard from './components/DecisionBoard.vue'
import AnnualReport from './components/AnnualReport.vue'
import SettingsPanel from './components/SettingsPanel.vue'

const store = useStore()
const active = ref('agenda')
const loading = ref(true)
const drawerOpen = ref(false)

const bottomTabs = [
  { key: 'agenda', label: '议程', icon: EditPen },
  { key: 'room', label: '会议室', icon: Microphone },
  { key: 'wall', label: '记忆', icon: Picture },
  { key: 'decision', label: '决策', icon: List }
]

const hasFamily = computed(() => store.getters['familyMeeting/hasFamily'])
const family = computed(() => store.state.familyMeeting.family)
const authUserName = computed(() => {
  const authUser = store.state.auth?.user
  return authUser?.nickname || authUser?.email || '未登录'
})

const syncStatus = computed(() => store.getters['familyMeeting/syncStatus'])
const syncLabel = computed(() => {
  const map = {
    idle:    '数据就绪',
    syncing: '同步中…',
    saved:   '云端已保存',
    error:   '同步失败'
  }
  return map[syncStatus.value] || '数据就绪'
})
const syncTagType = computed(() => {
  const map = {
    idle:    'info',
    syncing: 'warning',
    saved:   'success',
    error:   'danger'
  }
  return map[syncStatus.value] || 'info'
})

onMounted(async () => {
  await store.dispatch('familyMeeting/initFromBackend')
  // 🔒 确保 currentUserId 与站点登录用户同步
  const authUserId = store.state.auth?.user?.userId
  if (authUserId && store.state.familyMeeting.currentUserId !== authUserId) {
    store.dispatch('familyMeeting/switchUser', authUserId)
  }
  loading.value = false
})

function onNav(key) {
  active.value = key
  drawerOpen.value = false
}
</script>

<style lang="scss" scoped>
.fm-root {
  height: 100%;
}
.fm-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  gap: 16px;
}
.fm-loading-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ===== 主布局 =====
.fm-shell {
  height: calc(100vh - 64px);
}

// ===== 桌面侧边栏 =====
.fm-aside-desk {
  background: #0f172a;
  border-right: none;
}
.fm-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.fm-menu {
  border-right: none;
  background: transparent;
  padding-top: 12px;
  :deep(.el-menu-item) {
    color: #cbd5e1;
    border-radius: 10px;
    margin: 4px 10px;
    height: 46px;
    &.is-active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
  }
}

// ===== 移动端抽屉 =====
.fm-drawer {
  :deep(.el-drawer__body) { padding: 0; }
}
.fm-drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  background: #0f172a;
}
.fm-menu-mobile {
  background: #0f172a;
  border-right: none;
  min-height: calc(100vh - 64px);
  padding-top: 8px;
  :deep(.el-menu-item) {
    color: #cbd5e1;
    border-radius: 10px;
    margin: 4px 10px;
    height: 48px;
    font-size: 15px;
    &.is-active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }
    &:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
  }
}

// ===== 顶部栏 =====
.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  height: 56px;
  padding: 0 16px;
  gap: 12px;
}
.fm-hamburger {
  display: none;
  padding: 4px;
  color: #475569;
}
.fm-fam {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fm-fam-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}
.fm-user {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.fm-user-label {
  font-size: 13px;
  color: #64748b;
  margin-right: 6px;
  white-space: nowrap;
}

// ===== 内容区 =====
.fm-main {
  background: #f1f5f9;
  padding: 20px;
  overflow-y: auto;
  // 移动端给底部导航留空间
  padding-bottom: calc(20px + var(--bn-height, 0px));
}

// ===== 移动端底部导航 =====
.fm-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  z-index: 100;
  padding: 0 8px;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.bn-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #94a3b8;
  cursor: pointer;
  transition: color .15s;
  -webkit-tap-highlight-color: transparent;
  span { font-size: 10px; line-height: 1; }
  &.active {
    color: #6366f1;
    span { font-weight: 600; }
  }
}

// ===== 响应式断点 =====

// 平板及以下：隐藏桌面侧边栏，显示汉堡按钮 + 底部导航
@media (max-width: 1024px) {
  .fm-aside-desk { display: none; }
  .fm-hamburger { display: inline-flex; }
  .fm-bottom-nav {
    display: flex;
  }
  .fm-main {
    --bn-height: 56px;
    padding: 14px;
    padding-bottom: calc(14px + 56px + env(safe-area-inset-bottom, 0px));
  }
  .fm-shell {
    height: calc(100vh - 56px); // 顶部导航可能更矮
  }
  .fm-header { height: 52px; padding: 0 12px; }
  .fm-fam-name { font-size: 15px; max-width: 120px; }
}

// 手机端进一步缩小
@media (max-width: 480px) {
  .fm-header { height: 48px; padding: 0 10px; }
  .fm-fam-name { font-size: 14px; max-width: 100px; }
  .fm-user-label { display: none; }
  .fm-main {
    padding: 10px;
    padding-bottom: calc(10px + 56px + env(safe-area-inset-bottom, 0px));
  }
}
</style>

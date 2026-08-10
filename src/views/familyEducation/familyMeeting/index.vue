<template>
  <div class="fm-root">
    <!-- 加载中 -->
    <div v-if="loading" class="fm-loading">
      <el-icon class="fm-loading-icon" :size="48"><Loading /></el-icon>
      <p>正在加载家庭会议数据…</p>
    </div>

    <!-- 未加入家庭空间：引导前往家庭成员管理 -->
    <EmptyFamilyState v-else-if="!hasFamily" feature-name="家庭会议" />

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
            <!-- 邀请码展示 -->
            <template v-if="inviteCode">
              <span class="fm-invite-label">邀请码</span>
              <code class="fm-invite-code" :title="'点击复制邀请码'"
                @click.stop="onCopyInviteCode">{{ inviteCode }}</code>
              <el-button link size="small" type="primary" @click.stop="onCopyInviteCode">
                <el-icon :size="14"><CopyDocument /></el-icon>
              </el-button>
            </template>
            <el-button v-else link size="small" type="warning" :loading="inviteLoading" @click.stop="onGenerateInviteCode">
              生成邀请码
            </el-button>
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
import { ElMessage } from 'element-plus'
import {
  ChatDotRound, EditPen, Microphone, Picture, List, DataLine, Setting, Loading, Expand, CopyDocument
} from '@element-plus/icons-vue'
import AgendaBoard from './components/AgendaBoard.vue'
import MeetingRoom from './components/MeetingRoom.vue'
import MemoryWall from './components/MemoryWall.vue'
import DecisionBoard from './components/DecisionBoard.vue'
import AnnualReport from './components/AnnualReport.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import EmptyFamilyState from '../components/EmptyFamilyState.vue'

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
const currentUser = computed(() => store.getters['familyMeeting/currentUser'])
const family = computed(() => store.state.familyMeeting.family)
const inviteCode = computed(() => store.state.familyMeeting.family?.inviteCode || '')
const inviteLoading = ref(false)

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
  console.log('[familyMeeting index] onMounted, 开始初始化...')
  await store.dispatch('familyMeeting/initFromBackend')
  // 🔒 安全校验：如果存在家庭数据，但当前用户不在成员列表中，说明数据异常
  if (hasFamily.value && !currentUser.value) {
    console.warn('[familyMeeting] 数据异常：当前用户不在家庭成员列表中，强制重置')
    await store.dispatch('familyMeeting/resetAll')
    location.reload()
  }
  // 🔒 确保 currentUserId 与站点登录用户同步
  const authUserId = store.state.auth?.user?.userId
  console.log('[familyMeeting index] init完成, authUserId=', authUserId, 'currentUserId=', store.state.familyMeeting.currentUserId)
  if (authUserId && store.state.familyMeeting.currentUserId !== authUserId) {
    console.log('[familyMeeting index] currentUserId不同步，执行switchUser')
    store.dispatch('familyMeeting/switchUser', authUserId)
  }
  console.log('[familyMeeting index] 会议总数:', store.state.familyMeeting.meetings.length, '可见:', store.getters['familyMeeting/visibleMeetings'].length)
  loading.value = false
})

function onNav(key) {
  active.value = key
  drawerOpen.value = false
}

async function onCopyInviteCode() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

async function onGenerateInviteCode() {
  inviteLoading.value = true
  try {
    await store.dispatch('familyMeeting/generateInviteCode')
    ElMessage.success('邀请码已生成')
  } catch {
    ElMessage.error('生成失败')
  } finally {
    inviteLoading.value = false
  }
}
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
// ===== 暗色模式 =====
html.dark-mode {
  .fm-loading { color: #94a3b8; p { color: #94a3b8; } }
  .fm-header { background: linear-gradient(135deg, #1e1e2e 0%, #212136 100%); border-bottom-color: #2d2d4a; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .fm-hamburger { color: #94a3b8; &:hover { background: #252540; color: #a78bfa; } }
  .fm-fam-name { color: #e2dee9; }
  .fm-invite-label { color: #64748b; }
  .fm-invite-code {
    color: #a78bfa;
    background: linear-gradient(135deg, #1e1a2e, #242040);
    &:hover { background: #2a2448; color: #c4b5fd; }
  }
  .fm-user-label { color: #64748b; }
  .fm-main { background: linear-gradient(180deg, #0f0f1a 0%, #131325 100%); }
  .fm-bottom-nav { background: rgba(30, 30, 46, 0.95); border-top-color: rgba(45, 45, 74, 0.8); box-shadow: 0 -2px 16px rgba(0,0,0,0.3); }
  .bn-item { color: #64748b; &.active { color: #a78bfa; &::after { background: #a78bfa; } } }
}
</style>

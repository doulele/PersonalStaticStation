<template>
  <div class="family-page">
    <div class="page-header">
      <h1 class="page-title">家庭/教育</h1>
      <p class="page-desc">陪伴成长每一步</p>
    </div>
    
    <div class="tools-grid">

      <router-link to="/familyEducation/members" class="tool-card" @click="recordToolClick('/familyEducation/members')">
        <div class="tool-card-inner">
          <div class="tool-icon blue">
            <el-icon :size="32"><UserFilled /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">家庭成员管理</h3>
            <p class="tool-desc">创建/加入家庭空间、管理成员信息、邀请码，数据在家庭会议和愿望清单中共享</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <div class="tool-card" @click="handleWishTreeHoleClick">
        <div class="tool-card-inner">
          <div class="tool-icon orange">
            <el-icon :size="32"><MagicStick /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">家庭树洞 & 愿望清单</h3>
            <p class="tool-desc">全家一起追逐愿望，匿名分享心情。打卡进度、树洞倾诉、拍一拍鼓励</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="tool-card" @click="handleFamilyMeetingClick">
        <div class="tool-card-inner">
          <div class="tool-icon green">
            <el-icon :size="32"><ChatDotRound /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">家庭会议</h3>
            <p class="tool-desc">私密安全的家庭会议：议题收集、语音转写、记忆墙与决策追踪</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <router-link to="/familyEducation/babySleep" class="tool-card" @click="recordToolClick('/familyEducation/babySleep')">
        <div class="tool-card-inner">
          <div class="tool-icon purple">
            <el-icon :size="32"><Moon /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">宝宝哄睡</h3>
            <p class="tool-desc">白噪音、摇篮曲、自然音效，帮助宝宝安心入睡</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      
    </div>
  </div>
</template>

<script setup>
import { ElMessageBox } from 'element-plus'
import { ArrowRight, Moon, ChatDotRound, UserFilled, MagicStick } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

const familyMeetingPath = '/familyEducation/familyMeeting'
const wishTreeHolePath = '/familyEducation/wishTreeHole'

async function handleFamilyMeetingClick() {
  recordToolClick(familyMeetingPath)

  // 已登录 → 直接跳转
  if (store.getters['auth/isLoggedIn']) {
    router.push(familyMeetingPath)
    return
  }

  // 未登录 → 弹出登录提示
  try {
    await ElMessageBox.confirm('当前功能需要登录后才能使用', '提示', {
      confirmButtonText: '前往登录',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    })
    router.push({ path: '/login', query: { redirect: familyMeetingPath } })
  } catch {
    // 用户取消
  }
}

async function handleWishTreeHoleClick() {
  recordToolClick(wishTreeHolePath)

  if (store.getters['auth/isLoggedIn']) {
    router.push(wishTreeHolePath)
    return
  }

  try {
    await ElMessageBox.confirm('当前功能需要登录后才能使用', '提示', {
      confirmButtonText: '前往登录',
      cancelButtonText: '取消',
      type: 'warning',
      center: true
    })
    router.push({ path: '/login', query: { redirect: wishTreeHolePath } })
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode {
  .page-title { color: #e2dee9; }
  .page-desc { color: #94a3b8; }
  .tool-card-inner {
    background: #1e1e2e; border-color: #2d2d4a;
    &:hover {
      border-color: #a78bfa; background: #252540;
      box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12);
      .tool-arrow { color: #a78bfa; }
    }
  }
  .tool-name { color: #e2dee9; }
  .tool-desc { color: #94a3b8; }
  .tool-arrow { color: #64748b; }
}
</style>

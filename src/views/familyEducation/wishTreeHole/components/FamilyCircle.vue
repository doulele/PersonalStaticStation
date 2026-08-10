<template>
  <div class="family-circle">
    <!-- 全家心愿（共同愿望） -->
    <div class="circle-section" v-if="sharedWishes.length > 0">
      <h3 class="section-title">🎯 全家心愿</h3>
      <div class="shared-wishes">
        <div v-for="w in sharedWishes" :key="w.id" class="shared-wish-card">
          <div class="sw-title">{{ w.title }}</div>
          <el-progress :percentage="w.progress" :color="'#6366f1'" :stroke-width="8" />
          <div class="sw-footer">
            <span>{{ w.creatorName }}</span>
            <el-button size="small" text @click="$emit('pat', { userId: w.userId, targetType: 'wish', targetId: w.id, message: `拍了拍全家心愿「${w.title}」` })">
              👋 加油
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 家庭动态流 -->
    <div class="circle-section">
      <h3 class="section-title">📡 家庭动态</h3>
      <div v-if="activities.length > 0" class="activity-list">
        <div v-for="act in activities" :key="act.id" class="activity-item">
          <div class="act-avatar">👤</div>
          <div class="act-content">
            <div class="act-text">
              <strong>{{ act.userName }}</strong>
              {{ act.action }}
            </div>
            <div class="act-time">{{ timeAgo(act.time) }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-hint">暂无家庭动态</div>
    </div>

    <!-- 成员列表 -->
    <div class="circle-section">
      <h3 class="section-title">👨‍👩‍👧‍👦 家庭成员</h3>
      <div class="member-list">
        <div v-for="m in members" :key="m.id" class="member-item">
          <div class="member-avatar">
            {{ (m.nickname || m.name || '?')[0] }}
          </div>
          <div class="member-info">
            <div class="member-name">
              {{ m.nickname || m.name || '未知' }}
              <el-tag v-if="m.role === 'admin'" size="small" type="danger">管理员</el-tag>
            </div>
          </div>
          <el-button size="small" text @click="handlePat(m)">👋</el-button>
        </div>
      </div>

      <!-- 邀请码 -->
      <div class="invite-area" v-if="isAdmin && family?.inviteCode">
        <p class="invite-text">
          邀请码：<strong>{{ family.inviteCode }}</strong>
          <el-button size="small" text @click="copyInvite">复制</el-button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['pat'])
const store = useStore()

const family = computed(() => store.getters['wishTreeHole/family'])
const members = computed(() => store.getters['wishTreeHole/members'])
const isAdmin = computed(() => store.getters['wishTreeHole/isAdmin'])
const wishes = computed(() => store.state.wishTreeHole.wishes)

// 全家共享愿望
const sharedWishes = computed(() => wishes.value.filter(w => w.isShared && w.status === '进行中'))

// 家庭动态（组合数据）
const activities = computed(() => {
  const acts = []
  // 最近完成的愿望
  wishes.value.filter(w => w.status === '已完成' && w.updatedAt).forEach(w => {
    acts.push({
      id: `done-${w.id}`,
      userName: w.creatorName || '成员',
      action: `完成了愿望「${w.title}」`,
      time: w.updatedAt
    })
  })
  // 最近创建的愿望
  wishes.value.filter(w => w.status === '进行中').slice(0, 5).forEach(w => {
    acts.push({
      id: `new-${w.id}`,
      userName: w.creatorName || '成员',
      action: `新增了愿望「${w.title}」`,
      time: w.createdAt
    })
  })
  // 排序
  acts.sort((a, b) => new Date(b.time) - new Date(a.time))
  return acts.slice(0, 20)
})

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

function handlePat(member) {
  console.log('[FamilyCircle] handlePat clicked', member)
  const payload = {
    userId: member.id,
    targetType: 'member',
    targetId: member.id,
    message: `拍了拍 ${member.name || member.id}`
  }
  console.log('[FamilyCircle] emitting pat', payload)
  emit('pat', payload)
}

function copyInvite() {
  if (family.value?.inviteCode) {
    navigator.clipboard.writeText(family.value.inviteCode)
    ElMessage.success('已复制邀请码')
  }
}
</script>

<style lang="scss" scoped src="./FamilyCircle.scss"></style>

<style lang="scss">
html.dark-mode {
  .circle-section { background: #1e1e2e; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12); } }
  .section-title { color: #e2dee9; }
  .shared-wish-card { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } .sw-title { color: #e2dee9; } .sw-footer { color: #64748b; } }
  .activity-item { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } }
  .member-item { background: #252540; border-color: #2d2d4a; &:hover { border-color: #a78bfa; background: #1e1e2e; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); } }
  .member-name { color: #e2dee9; }
  .act-avatar { background: #1e2040; }
  .act-text { color: #94a3b8; strong { color: #a78bfa; } }
  .act-time { color: #64748b; }
  .invite-area { border-color: #2d2d4a; }
  .invite-text { color: #94a3b8; strong { color: #a78bfa; } }
  .empty-hint { color: #64748b; }
}
</style>

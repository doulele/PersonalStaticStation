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
        <div v-for="m in members" :key="m.userId || m.id" class="member-item">
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
  emit('pat', {
    userId: member.userId,
    targetType: 'member',
    targetId: member.userId,
    message: `拍了拍 ${member.nickname || member.name}`
  })
}

function copyInvite() {
  if (family.value?.inviteCode) {
    navigator.clipboard.writeText(family.value.inviteCode)
    ElMessage.success('已复制邀请码')
  }
}
</script>

<style lang="scss" scoped>
.family-circle {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.circle-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 28px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px;
}

.shared-wishes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shared-wish-card {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }

  .sw-title {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
  }
  .sw-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 12px;
    color: #94a3b8;
  }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }
}

.act-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.act-content {
  flex: 1;
}

.act-text {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  strong { color: #6366f1; }
}

.act-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.invite-area {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.invite-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  strong {
    color: #6366f1;
    font-size: 20px;
    letter-spacing: 3px;
    font-family: monospace;
  }
}

.empty-hint {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 14px;
}

@media (max-width: 768px) {
  .family-circle { gap: 12px; }
  .circle-section { padding: 20px; border-radius: 14px; }
  .section-title { font-size: 15px; margin-bottom: 12px; }
  .shared-wish-card { padding: 14px; }
  .activity-item { padding: 14px; }
  .member-item { padding: 14px; gap: 10px; }
  .invite-text strong { font-size: 16px; letter-spacing: 2px; }
}

@media (max-width: 480px) {
  .member-avatar { width: 34px; height: 34px; font-size: 14px; }
  .member-name { font-size: 13px; }
}
</style>

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

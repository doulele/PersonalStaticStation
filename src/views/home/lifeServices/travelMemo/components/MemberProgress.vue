<template>
  <el-dialog
    :model-value="visible"
    :title="'👥 成员打包进度' + (memoTitle ? ' (' + memoTitle + ')' : '')"
    width="400px"
    destroy-on-close
    @close="$emit('close')"
  >
    <div v-if="members.length === 0" class="empty-hint">
      还没有添加成员，点击导航栏 [编辑] 添加成员
    </div>

    <div v-else class="member-list">
      <div
        v-for="member in members"
        :key="member.id"
        class="member-card"
        @click="showMemberDetail(member)"
      >
        <div class="member-header">
          <span class="member-emoji">{{ member.emoji }}</span>
          <span class="member-name">{{ member.name }}</span>
          <span class="member-stat">
            {{ getMemberStats(member.id).checked }}/{{ getMemberStats(member.id).total }}
          </span>
        </div>
        <div class="member-bar">
          <div
            class="member-bar-fill"
            :style="{ width: getMemberStats(member.id).percent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="member-tip" v-if="members.length > 0">
      点击成员卡片查看未带清单
    </div>

    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>

    <!-- 成员未带清单子对话框 -->
    <el-dialog
      :model-value="!!detailMember"
      :title="detailMember ? detailMember.emoji + ' ' + detailMember.name + ' 未带物品' : ''"
      width="360px"
      append-to-body
      destroy-on-close
      @close="detailMember = null"
    >
      <div v-if="uncheckedItems.length === 0" class="empty-hint">
        🎉 全部已带，太棒了！
      </div>
      <div v-else class="uncheck-list">
        <div v-for="item in uncheckedItems" :key="item.id" class="uncheck-item">
          <span>{{ item.icon }}</span>
          <span>{{ item.name }}</span>
          <span v-if="item.note" class="uncheck-note">{{ item.note }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailMember = null">关闭</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  members: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
  memoTitle: { type: String, default: '' }
})

defineEmits(['close'])

const detailMember = ref(null)
const uncheckedItems = ref([])

function getMemberStats(memberId) {
  const memberItems = props.items.filter(it => it.assigneeId === memberId)
  const checked = memberItems.filter(it => it.checked).length
  const total = memberItems.length
  return {
    checked,
    total,
    percent: total > 0 ? Math.round((checked / total) * 100) : 0
  }
}

function showMemberDetail(member) {
  uncheckedItems.value = props.items.filter(it =>
    it.assigneeId === member.id && !it.checked
  )
  detailMember.value = member
}
</script>

<style lang="scss" scoped>
.empty-hint {
  text-align: center;
  color: #9ca3af;
  padding: 24px 0;
  font-size: 14px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.member-card {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #f59e0b;
    background: #fffbeb;
  }
}

.member-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.member-emoji {
  font-size: 22px;
}

.member-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.member-stat {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.member-bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.member-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.member-tip {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}

.uncheck-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uncheck-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
}

.uncheck-note {
  font-size: 12px;
  color: #9ca3af;
  margin-left: auto;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<template>
  <el-dialog
    :model-value="visible"
    title="管理成员"
    width="380px"
    destroy-on-close
    @close="$emit('close')"
  >
    <div class="member-list">
      <div v-for="(m, idx) in localMembers" :key="m.id" class="member-row">
        <span class="member-emoji" @click="pickEmoji(idx)">{{ m.emoji }}</span>
        <el-input
          v-model="m.name"
          size="small"
          class="member-name-input"
          placeholder="成员称呼"
          maxlength="10"
        />
        <span class="member-delete" @click="remove(idx)" title="删除">✕</span>
      </div>
    </div>

    <el-button class="add-member-btn" @click="add" style="width: 100%; margin-top: 12px;">
      + 添加成员
    </el-button>

    <!-- emoji 选择小弹窗 -->
    <div v-if="pickingIdx !== null" class="emoji-picker-popup">
      <div class="emoji-popup-header">
        <span>选择表情</span>
        <span class="emoji-popup-close" @click="pickingIdx = null">✕</span>
      </div>
      <div class="emoji-grid">
        <span
          v-for="e in EMOJI_POOL"
          :key="e"
          class="emoji-cell"
          :class="{ active: localMembers[pickingIdx]?.emoji === e }"
          @click="selectEmoji(e)"
        >{{ e }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const EMOJI_POOL = [
  '😊', '😍', '😎', '🤩', '😄', '🥰', '😇', '🤗',
  '👨', '👩', '👶', '👧', '👦', '🧑', '👴', '👵',
  '💪', '🧑‍💼', '👩‍💼', '🧑‍🎓', '👩‍🎓', '🎅', '🤶',
  '🐱', '🐶', '🐻', '🦊', '🐰', '🐼', '🐨', '🦁'
]

const props = defineProps({
  visible: { type: Boolean, default: false },
  members: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

const localMembers = ref([])
const pickingIdx = ref(null)

function initLocal() {
  localMembers.value = props.members.map(m => ({ ...m }))
  pickingIdx.value = null
}

// 用 watch 替代 @open 事件，确保每次打开弹窗都可靠加载已有成员
watch(() => props.visible, (val) => {
  if (val) {
    // nextTick 确保弹窗内容已挂载
    nextTick(() => initLocal())
  }
})

let nextId = Date.now()
function genId() { return 'mem_' + (nextId++) }

function add() {
  localMembers.value.push({ id: genId(), name: '新成员', emoji: '😊' })
}

function remove(idx) {
  localMembers.value.splice(idx, 1)
}

function pickEmoji(idx) {
  pickingIdx.value = idx
}

function selectEmoji(emoji) {
  if (pickingIdx.value !== null && localMembers.value[pickingIdx.value]) {
    localMembers.value[pickingIdx.value].emoji = emoji
  }
  pickingIdx.value = null
}

function save() {
  const valid = localMembers.value.filter(m => m.name.trim())
  emit('save', valid.map(m => ({ ...m, name: m.name.trim() })))
}
</script>

<style lang="scss" scoped>
.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 8px;
}

.member-emoji {
  font-size: 24px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  transition: background 0.15s;
  user-select: none;

  &:hover { background: #e5e7eb; }
}

.member-name-input {
  flex: 1;
}

.member-delete {
  color: #d1d5db;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
  user-select: none;

  &:hover { color: #ef4444; background: #fef2f2; }
}

.add-member-btn {
  border-style: dashed;
}

.emoji-picker-popup {
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
  padding: 12px;
  z-index: 10;
}

.emoji-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}

.emoji-popup-close {
  cursor: pointer;
  color: #9ca3af;
  &:hover { color: #374151; }
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emoji-cell {
  font-size: 22px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  user-select: none;

  &:hover { background: #f3f4f6; }

  &.active {
    border-color: #f59e0b;
    background: #fffbeb;
  }
}

// ==================== 夜间模式 ====================
:global(html.dark-mode) {
  .member-row {
    background: #1a1a2e;
  }

  .member-emoji:hover {
    background: #252540;
  }

  .member-delete {
    color: #4a4a6a;
    &:hover { color: #f87171; background: #3b1010; }
  }

  .emoji-picker-popup {
    background: #1a1a2e;
    border-color: #2d2d4a;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  }

  .emoji-popup-header {
    color: #94a3b8;
  }

  .emoji-popup-close {
    color: #64748b;
    &:hover { color: #e2dee9; }
  }

  .emoji-cell {
    &:hover { background: #252540; }
    &.active {
      border-color: #f59e0b;
      background: #2e1f0a;
    }
  }
}
</style>

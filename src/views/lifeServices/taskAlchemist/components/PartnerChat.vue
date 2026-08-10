<template>
  <transition name="chat-slide">
    <div v-if="visible" class="partner-chat-panel">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="chat-partner-info">
          <span class="chat-partner-emoji">{{ partner.emoji }}</span>
          <div>
            <span class="chat-partner-name">{{ partner.name }}</span>
            <span class="chat-partner-status">在线</span>
          </div>
        </div>
        <el-button text @click="visible = false" class="chat-close">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="chat-empty">
          <span class="chat-empty-icon">💬</span>
          <p>你的伙伴在等你说话~</p>
          <p class="chat-hint">试试输入「你好」或点击下方快捷指令</p>
        </div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="chat-message"
          :class="msg.role"
        >
          <span v-if="msg.role === 'partner'" class="msg-avatar">{{ partner.emoji }}</span>
          <div class="msg-bubble">{{ msg.content }}</div>
        </div>
      </div>

      <!-- 快捷指令 -->
      <div class="chat-commands">
        <span class="commands-label">指令：</span>
        <el-button size="small" @click="sendCommand('snooze')">😴 再睡5分钟</el-button>
        <el-button size="small" @click="sendCommand('proud')">😎 看看成绩</el-button>
        <el-button size="small" @click="sendCommand('silence')">🤫 安静一会</el-button>
      </div>

      <!-- 输入框 -->
      <div class="chat-input-area">
        <el-input
          v-model="inputText"
          placeholder="和伙伴说点什么..."
          @keyup.enter="sendText"
          :disabled="isSilence"
        >
          <template #append>
            <el-button @click="sendText" :disabled="!inputText.trim() || isSilence">
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

const props = defineProps({
  partner: { type: Object, required: true },
  stats: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['command'])

const visible = ref(false)
const messages = ref([])
const inputText = ref('')
const messagesRef = ref(null)

const isSilence = computed(() => {
  const until = parseInt(localStorage.getItem('ta_silence_until') || '0')
  return Date.now() < until
})

function toggle() {
  visible.value = !visible.value
  if (visible.value) {
    nextTick(() => scrollToBottom())
  }
}

function addMessage(role, content) {
  messages.value.push({ role, content, time: new Date() })
  nextTick(() => scrollToBottom())
}

function sendCommand(cmd) {
  emit('command', cmd)
}

function sendText() {
  const text = inputText.value.trim()
  if (!text) return
  addMessage('user', text)
  inputText.value = ''

  // 智能回复逻辑
  setTimeout(() => {
    const reply = getSmartReply(text.toLowerCase())
    addMessage('partner', reply)
  }, 800)
}

function getSmartReply(input) {
  const type = props.partner.type || 'tsundere'

  // 关键词匹配回复
  if (input.includes('你好') || input.includes('嗨') || input.includes('hi')) {
    const hi = {
      tsundere: '哼，终于想起来找我了？有什么任务需要我帮忙的？',
      gentle: '你好呀~今天有什么我可以帮你的吗？',
      hotblood: '哟！终于来了！今天我们要征服什么任务？'
    }
    return hi[type]
  }
  if (input.includes('谢谢') || input.includes('感谢')) {
    const thx = {
      tsundere: '哼…不客气。不过别以为这样就能偷懒哦！',
      gentle: '不客气呢~能帮到你我也很开心！',
      hotblood: '哈哈哈！战友之间不言谢！继续前进！'
    }
    return thx[type]
  }
  if (input.includes('累') || input.includes('不想') || input.includes('困难')) {
    const tired = {
      tsundere: '累什么累？看看你的任务列表！不过…休息5分钟也不是不行。',
      gentle: '累了就休息一下吧，我会一直在这里陪着你。要不要先做个低能耗的小任务？',
      hotblood: '疲惫是暂时的！但休息也是战斗的一部分！来，深呼吸！'
    }
    return tired[type]
  }
  if (input.includes('今天') || input.includes('做什么')) {
    const completed = props.stats?.completed || 0
    const total = props.stats?.total || 0
    return type === 'tsundere'
      ? `已完成${completed}/${total}个任务。${completed === 0 ? '一个都没做呢，懒虫！' : '还凑合吧…继续加油！'}`
      : type === 'hotblood'
        ? `🔥 已完成${completed}/${total}！${completed > 3 ? '今天状态不错！' : '还可以更燃！'}`
        : `今天已经完成了${completed}个任务呢~${completed > 3 ? '做得很好！' : '慢慢来，不着急~'}`
  }
  if (input.includes('鼓励') || input.includes('加油') || input.includes('打气')) {
    const cheer = {
      tsundere: '哼…那好吧。加油啦！别让我失望哦。',
      gentle: '你是最棒的！相信自己，一步一步来，我会一直陪着你的~',
      hotblood: '🔥🔥🔥 燃起来！！你是最强的炼金术士！没有任何任务能阻挡你！'
    }
    return cheer[type]
  }

  // 默认回复
  const defaults = {
    tsundere: ['哼，知道了。', '说完了？去干活吧。', '你还挺有意思的嘛。', '别以为这样我就会夸你。', '好吧好吧…'],
    gentle: ['好的呢~', '我在听哦~', '你说得对呢。', '嗯嗯，继续加油~', '需要我帮忙吗？'],
    hotblood: ['燃起来了！', '没错就是这样！', '说得好！', '让我们冲吧！', '很好！保持这股劲头！']
  }
  const pool = defaults[type]
  return pool[Math.floor(Math.random() * pool.length)]
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

defineExpose({ toggle, addMessage, scrollToBottom })
</script>

<style lang="scss" scoped src="./PartnerChat.scss"></style>

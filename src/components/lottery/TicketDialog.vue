<template>
  <transition name="ticket-overlay-fade">
    <div v-if="visible" class="ticket-overlay" @click.self="$emit('close')">
      <div class="ticket-wrapper">
        <!-- SSQ 双色球票面 -->
        <div v-if="type === 'ssq'" class="ticket-container ticket-container-ssq">
          <!-- 票头：Logo + 票号 -->
          <div class="ticket-top-ssq">
            <div class="ticket-logo-area">
              <span class="ticket-logo-icon">cp</span>
              <div class="ticket-logo-text">
                <span class="logo-main">中国福利彩票</span>
                <span class="logo-sub">CHINA WELFARE LOTTERY</span>
              </div>
            </div>
            <div class="ticket-id">{{ serial }}</div>
          </div>
          <!-- 游戏名称 -->
          <div class="ticket-game-title">双色球</div>
          <!-- 站点信息 -->
          <div class="ticket-info-grid-ssq">
            <span>站 号:{{ station }}</span>
            <span>流水号:{{ flow }}</span>
            <span>总倍数:{{ totalMultiplier }}</span>
            <span>销售期:{{ issue }}</span>
            <span>开奖期:{{ issue }}</span>
            <span>金 额:{{ totalAmount }}.00元</span>
          </div>
          <!-- 统一加倍控件 -->
          <div class="ticket-multiplier-bar ticket-multiplier-bar-ssq">
            <span class="multiplier-label">统一加倍</span>
            <span class="multiplier-btn" @click="decreaseGlobal">−</span>
            <span class="multiplier-val">{{ globalMultiplier }}</span>
            <span class="multiplier-btn" @click="increaseGlobal">+</span>
            <span class="multiplier-unit">倍</span>
          </div>
          <!-- 票身 -->
          <div class="ticket-body-ssq">
            <div v-for="(combo, idx) in combos" :key="idx" class="ticket-row-ssq">
              <span class="ticket-index-ssq">{{ String(idx + 1).padStart(2, '0') }}</span>
              <span class="ticket-balls-group-ssq">
                <span v-for="r in combo.reds" :key="r" class="ticket-ball-ssq red-ball-ssq">{{ String(r).padStart(2, '0') }}</span>
              </span>
              <span class="ticket-balls-group-ssq ticket-blue-group-ssq">
                <span class="ticket-ball-ssq blue-ball-ssq">{{ String(combo.blue).padStart(2, '0') }}</span>
              </span>
              <span class="ticket-row-multiplier">
                <span class="row-mult-btn" @click.stop="decreaseComboMultiplier(combo.id)">−</span>
                <span class="row-mult-val">{{ getMultiplier(combo.id) }}</span>
                <span class="row-mult-btn" @click.stop="increaseComboMultiplier(combo.id)">+</span>
                <span class="row-mult-unit">倍</span>
              </span>
            </div>
          </div>
          <!-- 底部信息 -->
          <div class="ticket-bottom-info-ssq">
            <div class="ticket-bottom-row">
              <span>开奖日期:{{ time.split(' ')[0] }}</span>
              <span>玩法:单式</span>
            </div>
            <div class="ticket-verify">验票码:{{ verifyCode }}</div>
            <div class="ticket-contrib-ssq">感谢您为公益事业贡献{{ contribution }}元</div>
          </div>
          <!-- 条形码 -->
          <div class="ticket-barcode-area">
            <div class="ticket-barcode">
              <span v-for="n in 60" :key="n" class="barcode-line" :style="{ height: (40 + Math.random() * 60) + '%' }"></span>
            </div>
            <div class="barcode-num">{{ serial.slice(-20) }}</div>
          </div>
          <!-- 承销单位 -->
          <div class="ticket-issuer">浙江省福利彩票管理中心承销</div>
        </div>

        <!-- DLT 大乐透票面 -->
        <div v-else class="ticket-container ticket-container-dlt">
          <!-- 右侧竖条 -->
          <div class="ticket-side-bar">
            <span v-for="n in 3" :key="n" class="side-text">☆中国体育彩票</span>
          </div>
          <!-- 内容区域（避开右侧竖条） -->
          <div class="ticket-dlt-inner">
            <!-- 票头：游戏标题 -->
            <div class="ticket-top-dlt">
              <span class="dlt-prefix">体彩</span>
              <span class="dlt-name">超级大乐透</span>
              <span class="dlt-badge">18周年</span>
            </div>
            <!-- 期号与开奖日期 -->
            <div class="ticket-issue-line">
              <span>第 {{ issue }}期</span>
              <span>{{ time.split(' ')[0] }}开奖</span>
            </div>
            <!-- 票号 -->
            <div class="ticket-serial-line">{{ serial }}</div>
            <!-- 分隔虚线 -->
            <div class="ticket-dashed-line"></div>
            <!-- 玩法信息 -->
            <div class="ticket-play-info">
              <span>单式票</span>
              <span>{{ totalMultiplier }}倍</span>
              <span>合计{{ totalAmount }}元</span>
            </div>
            <!-- 统一加倍控件 -->
            <div class="ticket-multiplier-bar ticket-multiplier-bar-dlt">
              <span class="multiplier-label">统一加倍</span>
              <span class="multiplier-btn" @click="decreaseGlobal">−</span>
              <span class="multiplier-val">{{ globalMultiplier }}</span>
              <span class="multiplier-btn" @click="increaseGlobal">+</span>
              <span class="multiplier-unit">倍</span>
            </div>
            <!-- 票身：号码 -->
            <div class="ticket-body-dlt">
              <div v-for="(combo, idx) in combos" :key="idx" class="ticket-row-dlt">
                <span class="ticket-index-dlt">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span class="ticket-balls-group-dlt">
                  <span v-for="r in combo.fronts" :key="r" class="ticket-ball-dlt front-ball-dlt">{{ String(r).padStart(2, '0') }}</span>
                </span>
                <span class="ticket-plus">+</span>
                <span class="ticket-balls-group-dlt ticket-back-group-dlt">
                  <span v-for="b in combo.backs" :key="'b'+b" class="ticket-ball-dlt back-ball-dlt">{{ String(b).padStart(2, '0') }}</span>
                </span>
                <span class="ticket-row-multiplier">
                  <span class="row-mult-btn" @click.stop="decreaseComboMultiplier(combo.id)">−</span>
                  <span class="row-mult-val">{{ getMultiplier(combo.id) }}</span>
                  <span class="row-mult-btn" @click.stop="increaseComboMultiplier(combo.id)">+</span>
                  <span class="row-mult-unit">倍</span>
                </span>
              </div>
            </div>
            <!-- 分隔虚线 -->
            <div class="ticket-dashed-line"></div>
            <!-- 底部信息 -->
            <div class="ticket-bottom-dlt">
              <p class="ticket-contrib-dlt">感谢您为公益事业贡献 {{ contribution }}元</p>
              <p class="ticket-slogan">[赠票] 公益体彩 乐善人生</p>
              <p class="ticket-addr">正阳路工人文化宫西沿街</p>
              <div class="ticket-meta-dlt">
                <span>{{ station.slice(0, 12) }}</span>
                <span>{{ flow.slice(0, 5) }}</span>
                <span>{{ time.split(' ')[0].replace(/\//g, '') }} {{ time.split(' ')[1] || '' }}</span>
              </div>
            </div>
            <!-- 条形码 -->
            <div class="ticket-barcode-dlt">
              <div class="barcode-strip">
                <span v-for="n in 80" :key="n" class="barcode-line-dlt" :style="{ height: (30 + Math.random() * 70) + '%', width: (1 + Math.random() * 2.5) + 'px' }"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <div class="ticket-close" @click="$emit('close')">
          <span>✕</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String, default: 'ssq', validator: v => ['ssq', 'dlt'].includes(v) },
  combos: { type: Array, default: () => [] },
  time: { type: String, default: '' },
  serial: { type: String, default: '' },
  issue: { type: String, default: '' },
  station: { type: String, default: '' },
  flow: { type: String, default: '' },
  verifyCode: { type: String, default: '' }
})

defineEmits(['close'])

// 加倍相关
const globalMultiplier = ref(1)
const multiplierMap = ref({})

// 总倍数
const totalMultiplier = computed(() => {
  let sum = 0
  for (const c of props.combos) {
    sum += getMultiplier(c.id)
  }
  return sum
})

// 总金额
const totalAmount = computed(() => totalMultiplier.value * 2)

// 公益贡献
const contribution = computed(() => (totalAmount.value * 0.36).toFixed(2))

// 获取某个号组的倍数
function getMultiplier(id) {
  return multiplierMap.value[id] ?? globalMultiplier.value
}

function increaseComboMultiplier(id) {
  const cur = getMultiplier(id)
  if (cur < 99) {
    multiplierMap.value = { ...multiplierMap.value, [id]: cur + 1 }
  }
}

function decreaseComboMultiplier(id) {
  const cur = getMultiplier(id)
  if (cur > 1) {
    multiplierMap.value = { ...multiplierMap.value, [id]: cur - 1 }
  }
}

function increaseGlobal() {
  if (globalMultiplier.value < 99) globalMultiplier.value++
}

function decreaseGlobal() {
  if (globalMultiplier.value > 1) globalMultiplier.value--
}

// 弹框打开时重置倍数
watch(() => props.visible, (val) => {
  if (val) {
    globalMultiplier.value = 1
    multiplierMap.value = {}
  }
})
</script>

<style lang="scss" scoped>
// ==================== 遮罩与包装 ====================
.ticket-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
}
.ticket-overlay-fade-enter-active,
.ticket-overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.ticket-overlay-fade-enter-from,
.ticket-overlay-fade-leave-to {
  opacity: 0;
}
.ticket-wrapper {
  position: relative;
  width: 400px;
  max-width: 94vw;
  max-height: 90vh;
  overflow-y: auto;
}
.ticket-close {
  position: absolute;
  top: -36px;
  right: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 18px;
  opacity: 0.7;
  transition: opacity 0.2s;
  &:hover { opacity: 1; }
}

// ==================== 通用容器 ====================
.ticket-container {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

// ==================== 通用加倍控件 ====================
.ticket-multiplier-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px dashed;
  .multiplier-label {
    font-size: 12px;
    font-weight: 700;
    margin-right: 8px;
  }
  .multiplier-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    line-height: 1;
    transition: all 0.15s;
    &:active { transform: scale(0.9); }
  }
  .multiplier-val {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    font-size: 16px;
    font-weight: 900;
    font-family: 'Courier New', monospace;
  }
  .multiplier-unit {
    font-size: 11px;
    font-weight: 700;
    margin-left: 2px;
  }
}
// 每行加倍控件
.ticket-row-multiplier {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  .row-mult-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    line-height: 1;
    transition: all 0.15s;
    &:active { transform: scale(0.85); }
  }
  .row-mult-val {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    font-size: 13px;
    font-weight: 900;
    font-family: 'Courier New', monospace;
  }
  .row-mult-unit {
    font-size: 9px;
    color: #999;
    font-weight: 600;
  }
}

// ==================== SSQ 双色球样式 ====================
.ticket-container-ssq {
  background: #fff5f5;
  border: 1px solid #d4a5a5;
  font-size: 12px;
  padding: 10px 14px 12px;
}
// 票头Logo区
.ticket-top-ssq {
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8c8c8;
}
.ticket-logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}
.ticket-logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #c41e3a;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  border-radius: 4px;
  letter-spacing: 1px;
  font-family: 'Arial Black', 'SimHei', sans-serif;
}
.ticket-logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  .logo-main {
    font-size: 16px;
    font-weight: 900;
    color: #c41e3a;
    letter-spacing: 3px;
  }
  .logo-sub {
    font-size: 8px;
    color: #c41e3a;
    letter-spacing: 1px;
    font-weight: 600;
  }
}
.ticket-id {
  font-size: 10px;
  color: #666;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}
// 游戏名称
.ticket-game-title {
  text-align: center;
  font-size: 22px;
  font-weight: 900;
  color: #333;
  letter-spacing: 8px;
  padding: 10px 0 6px;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
}
// 站点信息网格
.ticket-info-grid-ssq {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 10px;
  font-size: 11px;
  color: #555;
  padding: 4px 0 6px;
  border-bottom: 1px dashed #d4a5a5;
  span { font-family: 'Courier New', monospace; }
}
// SSQ 加倍控件
.ticket-multiplier-bar-ssq {
  border-color: #d4a5a5;
  .multiplier-label { color: #c41e3a; }
  .multiplier-btn {
    border: 1px solid #c41e3a;
    color: #c41e3a;
    &:hover { background: #c41e3a; color: #fff; }
  }
  .multiplier-val { color: #c41e3a; }
  .multiplier-unit { color: #c41e3a; }
}
// SSQ 票身
.ticket-body-ssq {
  padding: 6px 0;
  max-height: 42vh;
  overflow-y: auto;
}
.ticket-row-ssq {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px dotted #e8c8c8;
  &:last-child { border-bottom: none; }
}
.ticket-index-ssq {
  width: 28px;
  font-size: 12px;
  font-weight: 800;
  color: #c41e3a;
  flex-shrink: 0;
  text-align: center;
  font-family: 'Courier New', monospace;
}
.ticket-balls-group-ssq {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  &.ticket-blue-group-ssq {
    flex: none;
    width: 44px;
    justify-content: center;
  }
}
.ticket-ball-ssq {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 1.5px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.35);
  &.red-ball-ssq {
    background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%);
  }
  &.blue-ball-ssq {
    background: radial-gradient(circle at 35% 35%, #7eb8da, #2878b5 50%, #1a5276 100%);
  }
}
// SSQ 每行加倍
.ticket-row-ssq .ticket-row-multiplier {
  margin-left: 6px;
  .row-mult-btn {
    border: 1px solid #d4a5a5;
    color: #c41e3a;
    &:hover { background: #c41e3a; color: #fff; border-color: #c41e3a; }
  }
  .row-mult-val { color: #c41e3a; }
}
// SSQ 底部
.ticket-bottom-info-ssq {
  padding: 6px 0;
  border-top: 1px dashed #d4a5a5;
  font-size: 11px;
  color: #555;
}
.ticket-bottom-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  span { font-family: 'Courier New', monospace; }
}
.ticket-verify {
  font-size: 10px;
  color: #666;
  font-family: 'Courier New', monospace;
  margin-bottom: 3px;
  word-break: break-all;
}
.ticket-contrib-ssq {
  font-size: 11px;
  color: #c41e3a;
  font-weight: 700;
}
// SSQ 承销单位
.ticket-issuer {
  text-align: center;
  font-size: 12px;
  color: #c41e3a;
  font-weight: 700;
  padding-top: 6px;
  letter-spacing: 2px;
}

// ==================== DLT 大乐透样式 ====================
.ticket-container-dlt {
  background: #fff;
  border: 1px solid #ddd;
  font-size: 13px;
  padding: 0;
  overflow: hidden;
}
.ticket-dlt-inner {
  padding: 12px 36px 14px 14px;
}
// 右侧竖条
.ticket-side-bar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 22px;
  background: #c41e3a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 20px 0;
  z-index: 1;
  .side-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 11px;
    color: #fff;
    font-weight: 700;
    letter-spacing: 2px;
    white-space: nowrap;
  }
}
// DLT 票头
.ticket-top-dlt {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
  .dlt-prefix {
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }
  .dlt-name {
    font-size: 20px;
    font-weight: 900;
    color: #333;
    letter-spacing: 3px;
  }
  .dlt-badge {
    font-size: 10px;
    color: #c41e3a;
    border: 1px solid #c41e3a;
    padding: 0 4px;
    border-radius: 2px;
    margin-left: auto;
  }
}
// DLT 期号行
.ticket-issue-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0 2px;
  font-size: 13px;
  color: #333;
  font-weight: 700;
  span { font-family: 'Courier New', monospace; }
}
// DLT 票号
.ticket-serial-line {
  font-size: 11px;
  color: #666;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  padding-bottom: 4px;
}
// 虚线分隔
.ticket-dashed-line {
  height: 0;
  border-top: 1px dashed #999;
  margin: 6px 0;
}
// DLT 玩法信息
.ticket-play-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #333;
  font-weight: 700;
  padding: 2px 0 6px;
}
// DLT 加倍控件
.ticket-multiplier-bar-dlt {
  border-color: #999;
  .multiplier-label { color: #333; }
  .multiplier-btn {
    border: 1px solid #999;
    color: #333;
    &:hover { background: #c41e3a; color: #fff; border-color: #c41e3a; }
  }
  .multiplier-val { color: #333; }
  .multiplier-unit { color: #333; }
}
// DLT 票身
.ticket-body-dlt {
  padding: 4px 0;
  max-height: 42vh;
  overflow-y: auto;
}
.ticket-row-dlt {
  display: flex;
  align-items: center;
  padding: 5px 0;
  gap: 8px;
}
.ticket-index-dlt {
  width: 22px;
  font-size: 13px;
  font-weight: 800;
  color: #333;
  flex-shrink: 0;
  text-align: center;
  font-family: 'Courier New', monospace;
}
.ticket-balls-group-dlt {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  &.ticket-back-group-dlt {
    flex: none;
    width: auto;
  }
}
.ticket-plus {
  font-size: 16px;
  font-weight: 900;
  color: #333;
  padding: 0 2px;
}
.ticket-ball-dlt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 13px;
  color: #333;
  flex-shrink: 0;
  border: 1.5px solid #333;
  background: transparent;
}
// DLT 每行加倍
.ticket-row-dlt .ticket-row-multiplier {
  margin-left: 4px;
  .row-mult-btn {
    border: 1px solid #ccc;
    color: #666;
    &:hover { background: #c41e3a; color: #fff; border-color: #c41e3a; }
  }
  .row-mult-val { color: #333; }
}
// DLT 底部信息
.ticket-bottom-dlt {
  padding: 6px 0 4px;
  text-align: center;
  .ticket-contrib-dlt {
    font-size: 12px;
    color: #333;
    font-weight: 700;
    margin: 0 0 2px;
  }
  .ticket-slogan {
    font-size: 11px;
    color: #666;
    margin: 0 0 2px;
  }
  .ticket-addr {
    font-size: 11px;
    color: #333;
    font-weight: 700;
    margin: 0 0 3px;
  }
  .ticket-meta-dlt {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #666;
    font-family: 'Courier New', monospace;
    span { white-space: nowrap; }
  }
}
// DLT 条形码
.ticket-barcode-dlt {
  padding: 6px 0 2px;
  .barcode-strip {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 42px;
    gap: 1px;
    overflow: hidden;
    .barcode-line-dlt {
      display: inline-block;
      background: #333;
      min-height: 15%;
    }
  }
}

// ==================== 通用条形码 ====================
.ticket-barcode-area {
  padding: 6px 0 4px;
  text-align: center;
}
.ticket-barcode {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 36px;
  gap: 1.5px;
  overflow: hidden;
  .barcode-line {
    display: inline-block;
    width: 2px;
    background: #333;
    min-height: 20%;
  }
}
.barcode-num {
  font-size: 9px;
  color: #666;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  margin-top: 2px;
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .ticket-wrapper {
    width: 94vw;
    max-height: 85vh;
  }
  .ticket-close {
    top: -30px;
    right: 2px;
  }

  // SSQ 768px
  .ticket-container-ssq { padding: 8px 10px 10px; }
  .ticket-logo-icon { width: 28px; height: 28px; font-size: 12px; }
  .ticket-logo-text {
    .logo-main { font-size: 14px; letter-spacing: 2px; }
    .logo-sub { font-size: 7px; }
  }
  .ticket-game-title { font-size: 18px; letter-spacing: 6px; padding: 6px 0 4px; }
  .ticket-info-grid-ssq { font-size: 10px; gap: 2px 8px; }
  .ticket-body-ssq { padding: 4px 0; max-height: 40vh; }
  .ticket-index-ssq { width: 24px; font-size: 11px; }
  .ticket-balls-group-ssq { gap: 3px; &.ticket-blue-group-ssq { width: 40px; } }
  .ticket-ball-ssq { width: 26px; height: 26px; font-size: 11px; }
  .ticket-bottom-info-ssq { font-size: 10px; }
  .ticket-verify { font-size: 9px; }
  .ticket-contrib-ssq { font-size: 10px; }
  .ticket-barcode { height: 30px; .barcode-line { width: 1.5px; } }
  .barcode-num { font-size: 8px; }
  .ticket-issuer { font-size: 11px; padding-top: 4px; }

  // DLT 768px
  .ticket-dlt-inner { padding: 10px 28px 12px 10px; }
  .ticket-side-bar { width: 18px; padding: 16px 0; .side-text { font-size: 9px; letter-spacing: 1px; } }
  .ticket-top-dlt {
    .dlt-prefix { font-size: 12px; }
    .dlt-name { font-size: 17px; letter-spacing: 2px; }
    .dlt-badge { font-size: 9px; padding: 0 3px; }
  }
  .ticket-issue-line { font-size: 12px; padding: 4px 0 2px; }
  .ticket-serial-line { font-size: 10px; }
  .ticket-play-info { font-size: 12px; padding: 2px 0 4px; }
  .ticket-body-dlt { padding: 2px 0; max-height: 40vh; }
  .ticket-row-dlt { padding: 4px 0; gap: 6px; }
  .ticket-index-dlt { width: 20px; font-size: 12px; }
  .ticket-balls-group-dlt { gap: 4px; }
  .ticket-plus { font-size: 14px; }
  .ticket-ball-dlt { width: 26px; height: 26px; font-size: 12px; border-width: 1px; }
  .ticket-bottom-dlt {
    .ticket-contrib-dlt { font-size: 11px; }
    .ticket-slogan { font-size: 10px; }
    .ticket-addr { font-size: 10px; }
    .ticket-meta-dlt { font-size: 9px; }
  }
  .ticket-barcode-dlt { padding: 4px 0 2px; .barcode-strip { height: 36px; } }

  // 通用加倍 768px
  .ticket-multiplier-bar {
    gap: 2px; padding: 4px 0;
    .multiplier-label { font-size: 10px; margin-right: 4px; }
    .multiplier-btn { width: 20px; height: 20px; font-size: 12px; }
    .multiplier-val { font-size: 14px; min-width: 20px; }
    .multiplier-unit { font-size: 10px; }
  }
  .ticket-row-multiplier {
    gap: 1px;
    .row-mult-btn { width: 16px; height: 16px; font-size: 11px; }
    .row-mult-val { font-size: 12px; min-width: 14px; }
    .row-mult-unit { font-size: 8px; }
  }
}

@media (max-width: 480px) {
  // SSQ 480px
  .ticket-container-ssq { padding: 6px 8px 8px; }
  .ticket-logo-icon { width: 24px; height: 24px; font-size: 10px; }
  .ticket-logo-text {
    .logo-main { font-size: 12px; letter-spacing: 1.5px; }
    .logo-sub { font-size: 6px; }
  }
  .ticket-game-title { font-size: 16px; letter-spacing: 4px; padding: 4px 0 2px; }
  .ticket-info-grid-ssq { font-size: 9px; gap: 2px 6px; }
  .ticket-body-ssq { padding: 2px 0; max-height: 35vh; }
  .ticket-index-ssq { width: 22px; font-size: 10px; }
  .ticket-balls-group-ssq { gap: 2px; &.ticket-blue-group-ssq { width: 36px; } }
  .ticket-ball-ssq { width: 24px; height: 24px; font-size: 10px; }
  .ticket-bottom-info-ssq { font-size: 9px; }
  .ticket-verify { font-size: 8px; }
  .ticket-contrib-ssq { font-size: 9px; }
  .ticket-barcode { height: 26px; .barcode-line { width: 1.2px; } }
  .barcode-num { font-size: 7px; }
  .ticket-issuer { font-size: 10px; padding-top: 3px; }

  // DLT 480px
  .ticket-dlt-inner { padding: 8px 22px 10px 8px; }
  .ticket-side-bar { width: 16px; padding: 12px 0; .side-text { font-size: 8px; letter-spacing: 0.5px; } }
  .ticket-top-dlt {
    .dlt-prefix { font-size: 11px; }
    .dlt-name { font-size: 15px; letter-spacing: 1.5px; }
    .dlt-badge { font-size: 8px; padding: 0 2px; }
  }
  .ticket-issue-line { font-size: 11px; padding: 3px 0 1px; }
  .ticket-serial-line { font-size: 9px; }
  .ticket-play-info { font-size: 11px; padding: 1px 0 3px; }
  .ticket-body-dlt { padding: 2px 0; max-height: 35vh; }
  .ticket-row-dlt { padding: 3px 0; gap: 4px; }
  .ticket-index-dlt { width: 18px; font-size: 11px; }
  .ticket-balls-group-dlt { gap: 3px; }
  .ticket-plus { font-size: 12px; }
  .ticket-ball-dlt { width: 24px; height: 24px; font-size: 11px; border-width: 1px; }
  .ticket-bottom-dlt {
    .ticket-contrib-dlt { font-size: 10px; }
    .ticket-slogan { font-size: 9px; }
    .ticket-addr { font-size: 9px; }
    .ticket-meta-dlt { font-size: 8px; }
  }
  .ticket-barcode-dlt { padding: 3px 0 1px; .barcode-strip { height: 30px; } }

  // 通用加倍 480px
  .ticket-multiplier-bar {
    gap: 2px; padding: 3px 0;
    .multiplier-label { font-size: 9px; margin-right: 2px; }
    .multiplier-btn { width: 18px; height: 18px; font-size: 11px; }
    .multiplier-val { font-size: 13px; min-width: 18px; }
    .multiplier-unit { font-size: 9px; }
  }
  .ticket-row-multiplier {
    gap: 1px;
    .row-mult-btn { width: 14px; height: 14px; font-size: 10px; }
    .row-mult-val { font-size: 11px; min-width: 12px; }
    .row-mult-unit { font-size: 7px; }
  }
}
</style>

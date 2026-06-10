<template>
  <div class="win-query-panel">
    <!-- 输入方式选择 -->
    <div class="input-mode-section">
      <div class="mode-tabs">
        <button
          class="mode-tab"
          :class="{ active: inputMode === 'manual' }"
          @click="inputMode = 'manual'"
        >
          <el-icon><Edit /></el-icon>
          <span>手动输入</span>
        </button>
        <button
          class="mode-tab"
          :class="{ active: inputMode === 'camera' }"
          @click="inputMode = 'camera'"
        >
          <el-icon><Camera /></el-icon>
          <span>拍照识别</span>
        </button>
      </div>
    </div>

    <!-- ===== 手动输入区域 ===== -->
    <div v-if="inputMode === 'manual'" class="manual-section">
      <!-- 期号选择 -->
      <div class="issue-select-row">
        <label class="input-label">选择期号</label>
        <el-select
          v-model="selectedIssue"
          placeholder="请选择期号（默认最新）"
          filterable
          class="issue-select"
          @change="onIssueChange"
        >
          <el-option
            v-for="item in issueList"
            :key="item.issue"
            :label="`${item.issue} (${item.date})`"
            :value="item.issue"
          />
        </el-select>
      </div>

      <!-- 手动号码输入 -->
      <div class="manual-input-area">
        <div class="number-grid">
          <!-- 红球/前区 -->
          <div class="number-group">
            <div class="group-header">
              <span class="group-dot front-dot"></span>
              <span class="group-title">{{ isDLT ? '前区' : '红球' }}</span>
              <span class="group-hint">选{{ isDLT ? '5' : '6' }}个 ({{ isDLT ? '1-35' : '1-33' }})</span>
            </div>
            <div class="ball-picker">
              <button
                v-for="n in (isDLT ? 35 : 33)"
                :key="'f'+n"
                class="picker-ball front-ball"
                :class="{ selected: frontNumbers.includes(n) }"
                @click="toggleFront(n)"
              >
                {{ String(n).padStart(2, '0') }}
              </button>
            </div>
          </div>

          <!-- 蓝球/后区 -->
          <div class="number-group">
            <div class="group-header">
              <span class="group-dot back-dot"></span>
              <span class="group-title">{{ isDLT ? '后区' : '蓝球' }}</span>
              <span class="group-hint">选{{ isDLT ? '2' : '1' }}个 ({{ isDLT ? '1-12' : '1-16' }})</span>
            </div>
            <div class="ball-picker">
              <button
                v-for="n in (isDLT ? 12 : 16)"
                :key="'b'+n"
                class="picker-ball back-ball"
                :class="{ selected: backNumbers.includes(n) }"
                @click="toggleBack(n)"
              >
                {{ String(n).padStart(2, '0') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 彩种切换 -->
      <div class="type-switch-row">
        <span class="type-hint">彩种类型：</span>
        <button
          class="type-btn"
          :class="{ active: lotteryType === 'ssq' }"
          @click="switchLotteryType('ssq')"
        >
          <span class="type-dot red"></span>双色球
        </button>
        <button
          class="type-btn"
          :class="{ active: lotteryType === 'dlt' }"
          @click="switchLotteryType('dlt')"
        >
          <span class="type-dot purple"></span>大乐透
        </button>
      </div>

    </div>

    <!-- ===== 拍照识别区域 ===== -->
    <div v-else class="camera-section">
      <div class="camera-actions">
        <button class="camera-btn" @click="triggerCamera">
          <el-icon><Camera /></el-icon>
          <span>拍照</span>
        </button>
        <button class="camera-btn" @click="triggerUpload">
          <el-icon><FolderOpened /></el-icon>
          <span>从相册选择</span>
        </button>
      </div>

      <!-- 预览区域 -->
      <div v-if="capturedImage" class="preview-area">
        <div
          class="crop-wrapper"
          ref="previewContainer"
          @pointerdown="onCropStart"
          @pointermove.prevent="onCropMove"
          @pointerup="onCropEnd"
          @pointercancel="onCropEnd"
        >
          <img :src="capturedImage" alt="彩票照片" class="preview-img" draggable="false" @load="onPreviewImageLoad" />
          <!-- 裁剪半透明遮罩（4 块拼出框外暗区） -->
          <div v-if="cropRect" class="crop-mask" :style="cropMaskStyleTop" />
          <div v-if="cropRect" class="crop-mask" :style="cropMaskStyleBottom" />
          <div v-if="cropRect" class="crop-mask" :style="cropMaskStyleLeft" />
          <div v-if="cropRect" class="crop-mask" :style="cropMaskStyleRight" />
          <!-- 裁剪框（清除区域 + 角标） -->
          <div v-if="cropRect" class="crop-box" :style="cropBoxStyle">
            <span class="crop-corner tl"></span>
            <span class="crop-corner tr"></span>
            <span class="crop-corner bl"></span>
            <span class="crop-corner br"></span>
          </div>
          <!-- 操作提示 -->
          <div v-if="!cropRect && !ocrLoading" class="crop-hint">
            <span class="crop-hint-icon">👆</span>
            <span>拖拽框选号码区域</span>
          </div>
          <!-- Loading 遮罩 -->
          <div class="preview-overlay" v-if="ocrLoading">
            <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
            <span>正在识别号码...</span>
          </div>
        </div>
        <!-- 裁剪操作按钮 -->
        <div v-if="cropRect && !ocrLoading" class="crop-actions">
          <span v-if="cropTooSmall" class="crop-warn">框选区域太小，请重新框选</span>
          <button class="crop-action-btn confirm" :disabled="cropTooSmall" @click="runCropOCR">确认裁剪并识别</button>
          <button class="crop-action-btn reset" @click="resetCrop">重新框选</button>
        </div>
        <div v-else-if="!cropRect && !ocrLoading" class="crop-actions simple">
          <button class="crop-action-btn skip" @click="runFullOCR">整图识别（跳过裁剪）</button>
        </div>
      </div>

      <!-- OCR 识别结果 -->
      <div v-if="ocrResult" class="ocr-result-card">
        <div class="ocr-result-header">
          <span>识别结果</span>
          <el-tag :type="ocrResult.type === 'ssq' ? 'danger' : 'primary'" size="small">
            {{ ocrResult.type === 'ssq' ? '双色球' : '大乐透' }}
          </el-tag>
          <span v-if="ocrResult.issue" class="ocr-issue">期号: {{ ocrResult.issue }}</span>
          <span v-if="ocrResultGroups.length > 1" class="ocr-group-count">共 {{ ocrResultGroups.length }} 注</span>
        </div>
        <!-- 多组显示 -->
        <div
          v-for="(group, gIdx) in ocrResultGroups"
          :key="'g' + gIdx"
          class="ocr-result-balls"
          :class="{ 'ocr-group-row': ocrResultGroups.length > 1 }"
        >
          <span v-if="ocrResultGroups.length > 1" class="ocr-group-label">{{ gIdx + 1 }}</span>
          <template v-if="group.type === 'ssq'">
            <span v-for="r in group.numbers.reds" :key="'r'+gIdx+'-'+r" class="ocr-ball red">{{ String(r).padStart(2, '0') }}</span>
            <span class="ocr-ball blue">{{ String(group.numbers.blue).padStart(2, '0') }}</span>
          </template>
          <template v-else>
            <span v-for="f in group.numbers.fronts" :key="'f'+gIdx+'-'+f" class="ocr-ball front">{{ String(f).padStart(2, '0') }}</span>
            <span class="ocr-sep">+</span>
            <span v-for="b in group.numbers.backs" :key="'b'+gIdx+'-'+b" class="ocr-ball back">{{ String(b).padStart(2, '0') }}</span>
          </template>
        </div>
        <!-- 手动修正 -->
        <div v-if="ocrNeedFix" class="ocr-fix-hint">
          <el-icon><WarningFilled /></el-icon>
          识别可能不完整，请手动修正后再查询
        </div>
        <div class="ocr-edit-row" v-if="ocrNeedFix">
          <span class="edit-label">手动修正：</span>
          <el-input
            v-if="ocrResult.type === 'ssq'"
            v-model="ocrFixSSQ"
            placeholder="如: 01,05,12,18,22,30+07"
            class="fix-input"
          />
          <el-input
            v-else
            v-model="ocrFixDLT"
            placeholder="如: 03,08,15,22,31+05,09"
            class="fix-input"
          />
          <el-button type="primary" size="small" @click="applyFix">应用修正</el-button>
        </div>
      </div>

      <!-- 拍照模式期号 -->
      <div v-if="ocrResult" class="camera-issue-row">
        <label>查询期号</label>
        <el-select v-model="selectedIssue" placeholder="选择期号" filterable class="issue-select">
          <el-option
            v-for="item in cameraIssueOptions"
            :key="item.issue"
            :label="item.label"
            :value="item.issue"
          />
        </el-select>
      </div>

      <!-- 隐藏的摄像头和文件输入 -->
      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        style="display:none"
        @change="onImagePicked"
      />
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display:none"
        @change="onImagePicked"
      />
    </div>

    <!-- ===== 查询按钮 ===== -->
    <div class="query-btn-row" v-if="canQuery">
      <button class="query-btn" @click="doQuery" :disabled="queryLoading">
        <el-icon v-if="queryLoading"><Loading /></el-icon>
        <el-icon v-else><Search /></el-icon>
        <span>{{ queryLoading ? '查询中...' : '查询中奖结果' }}</span>
      </button>
    </div>

    <!-- ===== 查询结果 ===== -->
    <div v-if="queryResult" class="result-section">
      <!-- 中奖等级标签 -->
      <div class="prize-banner" :class="prizeStyle.cls">
        <div class="prize-badge">{{ prizeStyle.label }}</div>
        <p v-if="queryResult.level > 0" class="prize-congrats">
          🎉 恭喜中奖！您中了 <strong>{{ prizeStyle.label }}</strong>
        </p>
        <p v-else class="prize-sorry">很遗憾，本次未中奖。继续加油！</p>
      </div>

      <!-- 开奖号码 -->
      <div class="draw-result-card">
        <div class="card-title">
          <span>第 {{ selectedIssue }} 期 开奖号码</span>
          <span class="card-date">{{ drawResult.date }}</span>
        </div>
        <div class="draw-balls">
          <template v-if="lotteryType === 'ssq'">
            <span
              v-for="r in drawResult.reds"
              :key="'dr'+r"
              class="draw-ball red"
              :class="{ matched: queryResult.matchedReds?.includes(r) }"
            >{{ String(r).padStart(2, '0') }}</span>
            <span
              class="draw-ball blue"
              :class="{ matched: queryResult.matchedBlue }"
            >{{ String(drawResult.blue).padStart(2, '0') }}</span>
          </template>
          <template v-else>
            <span
              v-for="f in drawResult.fronts"
              :key="'df'+f"
              class="draw-ball front"
              :class="{ matched: queryResult.matchedFronts?.includes(f) }"
            >{{ String(f).padStart(2, '0') }}</span>
            <span class="draw-sep">+</span>
            <span
              v-for="b in drawResult.backs"
              :key="'db'+b"
              class="draw-ball back"
              :class="{ matched: queryResult.matchedBacks?.includes(b) }"
            >{{ String(b).padStart(2, '0') }}</span>
          </template>
        </div>
      </div>

      <!-- 用户号码 vs 开奖号码 对比 -->
      <div class="compare-card">
        <div class="card-title">您的号码</div>
        <div class="compare-row">
          <div class="compare-label">您选的</div>
          <div class="compare-balls">
            <template v-if="lotteryType === 'ssq'">
              <span
                v-for="r in userDisplayReds"
                :key="'ur'+r"
                class="user-ball red"
                :class="{ hit: queryResult.matchedReds?.includes(r) }"
              >{{ String(r).padStart(2, '0') }}</span>
              <span
                class="user-ball blue"
                :class="{ hit: queryResult.matchedBlue }"
              >{{ String(userDisplayBlue).padStart(2, '0') }}</span>
            </template>
            <template v-else>
              <span
                v-for="f in userDisplayFronts"
                :key="'uf'+f"
                class="user-ball front"
                :class="{ hit: queryResult.matchedFronts?.includes(f) }"
              >{{ String(f).padStart(2, '0') }}</span>
              <span class="user-sep">+</span>
              <span
                v-for="b in userDisplayBacks"
                :key="'ub'+b"
                class="user-ball back"
                :class="{ hit: queryResult.matchedBacks?.includes(b) }"
              >{{ String(b).padStart(2, '0') }}</span>
            </template>
          </div>
        </div>
        <div class="compare-row">
          <div class="compare-label">开奖的</div>
          <div class="compare-balls">
            <template v-if="lotteryType === 'ssq'">
              <span
                v-for="r in drawResult.reds"
                :key="'cr'+r"
                class="user-ball red dim"
              >{{ String(r).padStart(2, '0') }}</span>
              <span class="user-ball blue dim">{{ String(drawResult.blue).padStart(2, '0') }}</span>
            </template>
            <template v-else>
              <span
                v-for="f in drawResult.fronts"
                :key="'cf'+f"
                class="user-ball front dim"
              >{{ String(f).padStart(2, '0') }}</span>
              <span class="user-sep">+</span>
              <span
                v-for="b in drawResult.backs"
                :key="'cb'+b"
                class="user-ball back dim"
              >{{ String(b).padStart(2, '0') }}</span>
            </template>
          </div>
        </div>
        <!-- 中奖详情 -->
        <div class="match-detail">
          <template v-if="lotteryType === 'ssq'">
            <span class="detail-item">
              红球中 <strong>{{ queryResult.matchedReds?.length || 0 }}</strong> 个
            </span>
            <span class="detail-divider">|</span>
            <span class="detail-item">
              蓝球 <strong :class="{ 'text-success': queryResult.matchedBlue, 'text-fail': !queryResult.matchedBlue }">
                {{ queryResult.matchedBlue ? '中' : '未中' }}
              </strong>
            </span>
          </template>
          <template v-else>
            <span class="detail-item">
              前区中 <strong>{{ queryResult.matchedFronts?.length || 0 }}</strong> 个
            </span>
            <span class="detail-divider">|</span>
            <span class="detail-item">
              后区中 <strong>{{ queryResult.matchedBacks?.length || 0 }}</strong> 个
            </span>
          </template>
        </div>
      </div>

      <!-- 中奖规则入口 -->
      <div class="rules-entry-inline">
        <span class="rules-link-btn" @click="showRulesDialog = true">查看中奖规则</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMsg" class="error-msg">
      <el-icon><WarningFilled /></el-icon>
      {{ errorMsg }}
    </div>

    <!-- ===== 中奖规则弹框 ===== -->
    <el-dialog
      v-model="showRulesDialog"
      :title="rulesDialogTitle"
      width="90%"
      :close-on-click-modal="true"
      :show-close="false"
      destroy-on-close
    >
      <div class="rules-dialog-content">
        <template v-if="rulesDialogType === 'ssq'">
          <div class="rules-table">
            <div class="rules-row"><span class="rules-level">一等奖</span><span class="rules-desc">6红+1蓝</span></div>
            <div class="rules-row"><span class="rules-level">二等奖</span><span class="rules-desc">6红+0蓝</span></div>
            <div class="rules-row"><span class="rules-level">三等奖</span><span class="rules-desc">5红+1蓝（3000元）</span></div>
            <div class="rules-row"><span class="rules-level">四等奖</span><span class="rules-desc">5红+0蓝 或 4红+1蓝（200元）</span></div>
            <div class="rules-row"><span class="rules-level">五等奖</span><span class="rules-desc">4红+0蓝 或 3红+1蓝（10元）</span></div>
            <div class="rules-row"><span class="rules-level">六等奖</span><span class="rules-desc">中蓝球（5元）</span></div>
          </div>
        </template>
        <template v-else>
          <div class="rules-table">
            <div class="rules-row"><span class="rules-level">一等奖</span><span class="rules-desc">5前+2后</span></div>
            <div class="rules-row"><span class="rules-level">二等奖</span><span class="rules-desc">5前+1后</span></div>
            <div class="rules-row"><span class="rules-level">三等奖</span><span class="rules-desc">5前+0后（10000元）</span></div>
            <div class="rules-row"><span class="rules-level">四等奖</span><span class="rules-desc">4前+2后（3000元）</span></div>
            <div class="rules-row"><span class="rules-level">五等奖</span><span class="rules-desc">4前+1后（300元）</span></div>
            <div class="rules-row"><span class="rules-level">六等奖</span><span class="rules-desc">3前+2后（200元）</span></div>
            <div class="rules-row"><span class="rules-level">七等奖</span><span class="rules-desc">4前+0后（100元）</span></div>
            <div class="rules-row"><span class="rules-level">八等奖</span><span class="rules-desc">3前+1后 或 2前+2后（15元）</span></div>
            <div class="rules-row"><span class="rules-level">九等奖</span><span class="rules-desc">其余中奖组合（5元）</span></div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="showRulesDialog = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Edit, Camera, FolderOpened, Loading, Search, WarningFilled } from '@element-plus/icons-vue'
import { fetchLatestDraw, fetchHistoryDraws, fetchDrawByIssue } from '@/api/lottery'
import { checkSSQ, checkDLT, getPrizeStyle } from '@/utils/lottery/prizeRules'
import { cropAndPreprocess } from '@/utils/imagePreprocess'

// ===== 输入模式 =====
const inputMode = ref('manual') // 'manual' | 'camera'
const lotteryType = ref('ssq') // 'ssq' | 'dlt'
const isDLT = computed(() => lotteryType.value === 'dlt')

// ===== 中奖规则弹框 =====
const showRulesDialog = ref(false)
const rulesDialogType = computed(() => {
  if (inputMode.value === 'camera' && ocrResult.value) {
    return ocrResult.value.type
  }
  return lotteryType.value
})
const rulesDialogTitle = computed(() => {
  return rulesDialogType.value === 'ssq' ? '双色球中奖规则' : '大乐透中奖规则'
})

// ===== 手动输入 =====
const frontNumbers = ref([])
const backNumbers = ref([])

const pickFront = computed(() => isDLT.value ? 5 : 6)
const pickBack = computed(() => isDLT.value ? 2 : 1)

function toggleFront(n) {
  if (frontNumbers.value.includes(n)) {
    frontNumbers.value = frontNumbers.value.filter(v => v !== n)
  } else if (frontNumbers.value.length < pickFront.value) {
    frontNumbers.value = [...frontNumbers.value, n].sort((a, b) => a - b)
  }
}

function toggleBack(n) {
  if (backNumbers.value.includes(n)) {
    backNumbers.value = backNumbers.value.filter(v => v !== n)
  } else if (backNumbers.value.length < pickBack.value) {
    backNumbers.value = [...backNumbers.value, n].sort((a, b) => a - b)
  }
}

function resetResults() {
  queryResult.value = null
  drawResult.value = null
  errorMsg.value = ''
}

function switchLotteryType(type) {
  lotteryType.value = type
  frontNumbers.value = []
  backNumbers.value = []
  resetResults()
}

// 号码选不满时重置开奖结果
watch([frontNumbers, backNumbers], () => {
  if (queryResult.value || drawResult.value) {
    if (frontNumbers.value.length < pickFront.value || backNumbers.value.length < pickBack.value) {
      resetResults()
    }
  }
})

// ===== 期号选择 =====
const issueList = ref([])
const selectedIssue = ref('')
const drawResult = ref(null)

onMounted(async () => {
  try {
    await loadIssueList()
  } catch (e) {
    console.error('加载期号列表失败:', e)
  }
  // 默认选最新一期
  if (issueList.value.length > 0) {
    selectedIssue.value = issueList.value[0].issue
  }
})

async function loadIssueList() {
  try {
    const [ssqList, dltList] = await Promise.all([
      fetchHistoryDraws('ssq', 50),
      fetchHistoryDraws('dlt', 50),
    ])
    // 合并并排序
    issueList.value = [...ssqList, ...dltList]
      .sort((a, b) => b.issue.localeCompare(a.issue))
      .slice(0, 50)
  } catch (e) {
    console.error('loadIssueList 异常:', e)
    issueList.value = []
  }
}

function detectDrawType(draw) {
  if (draw.reds) return 'ssq'
  if (draw.fronts) return 'dlt'
  return null
}

async function onIssueChange(issue) {
  const item = issueList.value.find(i => i.issue === issue)
  if (item) {
    drawResult.value = item
    // 自动推断彩种
    if (item.reds) lotteryType.value = 'ssq'
    else if (item.fronts) lotteryType.value = 'dlt'
  }
}

// ===== 查询逻辑 =====
const queryLoading = ref(false)
const queryResult = ref(null)
const errorMsg = ref('')

const canQuery = computed(() => {
  if (inputMode.value === 'manual') {
    return frontNumbers.value.length === pickFront.value && backNumbers.value.length === pickBack.value
  }
  // 拍照模式：OCR 有结果或修正后有结果
  if (ocrResult.value) {
    if (ocrNeedFix.value && !ocrFixApplied.value) return false
    return true
  }
  return false
})

const prizeStyle = computed(() => {
  if (!queryResult.value) return getPrizeStyle(0)
  return getPrizeStyle(queryResult.value.level)
})

async function doQuery() {
  queryLoading.value = true
  errorMsg.value = ''
  queryResult.value = null

  try {
    // 拍照模式：以 OCR 识别结果为准
    const isCamera = inputMode.value === 'camera'
    if (isCamera && ocrResult.value) {
      lotteryType.value = ocrResult.value.type
    }

    // 获取开奖数据 — 优先匹配用户选择的期号+彩种
    let draw
    if (selectedIssue.value) {
      // 精确匹配：期号+彩种
      const item = issueList.value.find(
        i => i.issue === selectedIssue.value && detectDrawType(i) === lotteryType.value
      )
      if (item) {
        draw = item
      } else {
        // 只匹配期号（跨彩种 fallback）
        const fallback = issueList.value.find(i => i.issue === selectedIssue.value)
        if (fallback) {
          draw = fallback
        } else {
          // issueList 中没有该期号，尝试获取该期开奖数据
          draw = await fetchDrawByIssue(selectedIssue.value, lotteryType.value)
        }
      }
    } else {
      draw = await fetchLatestDraw(lotteryType.value)
    }

    if (!draw) {
      errorMsg.value = '获取开奖数据失败，请稍后重试'
      queryLoading.value = false
      return
    }

    // 如果 draw 的彩种和当前不一致（fallback 匹配到了另一个彩种的期号），尝试修正
    if (detectDrawType(draw) !== lotteryType.value && selectedIssue.value) {
      const correct = issueList.value.find(
        i => i.issue === selectedIssue.value && detectDrawType(i) === lotteryType.value
      )
      if (correct) {
        draw = correct
      }
    }

    drawResult.value = draw
    selectedIssue.value = draw.issue

    // 获取用户号码
    let userNumbers
    if (isCamera) {
      userNumbers = ocrResult.value.numbers
    } else {
      if (lotteryType.value === 'ssq') {
        userNumbers = { reds: [...frontNumbers.value], blue: backNumbers.value[0] }
      } else {
        userNumbers = { fronts: [...frontNumbers.value], backs: [...backNumbers.value] }
      }
    }

    // 判定中奖
    if (lotteryType.value === 'ssq') {
      queryResult.value = checkSSQ(userNumbers.reds, draw.reds, userNumbers.blue, draw.blue)
    } else {
      queryResult.value = checkDLT(userNumbers.fronts, userNumbers.backs, draw.fronts, draw.backs)
    }
  } catch (e) {
    errorMsg.value = '查询失败：' + e.message
  } finally {
    queryLoading.value = false
  }
}

// ===== 用户展示号码（手动输入或OCR识别结果） =====
const userDisplayReds = computed(() => {
  if (inputMode.value === 'camera' && ocrResult.value?.type === 'ssq') {
    return ocrResult.value.numbers.reds || []
  }
  return lotteryType.value === 'ssq' ? frontNumbers.value : []
})
const userDisplayBlue = computed(() => {
  if (inputMode.value === 'camera' && ocrResult.value?.type === 'ssq') {
    return ocrResult.value.numbers.blue || 0
  }
  return lotteryType.value === 'ssq' ? (backNumbers.value[0] || 0) : 0
})
const userDisplayFronts = computed(() => {
  if (inputMode.value === 'camera' && ocrResult.value?.type === 'dlt') {
    return ocrResult.value.numbers.fronts || []
  }
  return lotteryType.value === 'dlt' ? frontNumbers.value : []
})
const userDisplayBacks = computed(() => {
  if (inputMode.value === 'camera' && ocrResult.value?.type === 'dlt') {
    return ocrResult.value.numbers.backs || []
  }
  return lotteryType.value === 'dlt' ? backNumbers.value : []
})

// 拍照模式下，将 OCR 识别的期号也加入下拉选项（如果不在 issueList 中）
const cameraIssueOptions = computed(() => {
  const options = issueList.value.map(i => ({
    issue: i.issue,
    label: `${i.issue} (${i.date})`,
  }))
  // 如果 OCR 识别到期号且不在列表中，追加
  if (ocrResult.value?.issue) {
    const exists = options.some(o => o.issue === ocrResult.value.issue)
    if (!exists) {
      options.unshift({
        issue: ocrResult.value.issue,
        label: `${ocrResult.value.issue} (OCR识别)`,
      })
    }
  }
  return options
})

// ===== 拍照识别 =====
const cameraInput = ref(null)
const fileInput = ref(null)
const previewContainer = ref(null)   // 裁剪容器 DOM
const capturedImage = ref(null)
const originalFile = ref(null)       // 保留原始 File（整图 OCR 用）
const ocrLoading = ref(false)
const ocrResult = ref(null)
const ocrResultGroups = ref([])
const ocrNeedFix = ref(false)
const ocrFixSSQ = ref('')
const ocrFixDLT = ref('')
const ocrFixApplied = ref(false)

// 裁剪状态
const cropRect = ref(null)           // { x, y, w, h } 0~1 比例（相对于可见图片区域）
const cropDragging = ref(false)
const cropStart = ref({ x: 0, y: 0 })
const cropTooSmall = computed(() => {
  if (!cropRect.value) return false
  return cropRect.value.w < 0.05 || cropRect.value.h < 0.05
})

// 图片可见区域信息（补偿 object-fit: contain 的留白）
const imageVisInfo = ref(null)  // { elemW, elemH, visW, visH, offX, offY, offXPct, offYPct }

/** 图片加载完成后计算可见区域（object-fit: contain 会在宽高比不匹配时产生留白） */
function onPreviewImageLoad(e) {
  const img = e.target
  const natW = img.naturalWidth
  const natH = img.naturalHeight
  if (!natW || !natH) return

  const rect = img.getBoundingClientRect()
  const elemW = rect.width
  const elemH = rect.height
  const natRatio = natW / natH
  const elemRatio = elemW / elemH

  let visW, visH, offX, offY
  if (natRatio > elemRatio) {
    // 图片更宽 → 上下留白
    visW = elemW
    visH = elemW / natRatio
    offX = 0
    offY = (elemH - visH) / 2
  } else {
    // 图片更高（手机竖屏照片常见）→ 左右留白
    visH = elemH
    visW = elemH * natRatio
    offX = (elemW - visW) / 2
    offY = 0
  }

  imageVisInfo.value = {
    elemW, elemH, visW, visH, offX, offY,
    offXPct: offX / elemW,
    offYPct: offY / elemH,
    scaleX: elemW / visW,  // 可见→元素坐标转换因子
    scaleY: elemH / visH,
  }
}

// 裁剪遮罩/裁剪框 computed styles（补偿留白后的可见区域坐标）
const cropMaskStyleTop = computed(() => {
  if (!cropRect.value || !imageVisInfo.value) return {}
  const vi = imageVisInfo.value
  return { top: 0, left: 0, right: 0, height: `${(cropRect.value.y / vi.scaleY + vi.offYPct) * 100}%` }
})
const cropMaskStyleBottom = computed(() => {
  if (!cropRect.value || !imageVisInfo.value) return {}
  const vi = imageVisInfo.value
  const btmRel = (cropRect.value.y + cropRect.value.h) / vi.scaleY + vi.offYPct
  return { top: `${btmRel * 100}%`, left: 0, right: 0, bottom: 0 }
})
const cropMaskStyleLeft = computed(() => {
  if (!cropRect.value || !imageVisInfo.value) return {}
  const vi = imageVisInfo.value
  const topRel = cropRect.value.y / vi.scaleY + vi.offYPct
  const heightRel = cropRect.value.h / vi.scaleY
  return { top: `${topRel * 100}%`, left: 0, width: `${(cropRect.value.x / vi.scaleX + vi.offXPct) * 100}%`, height: `${heightRel * 100}%` }
})
const cropMaskStyleRight = computed(() => {
  if (!cropRect.value || !imageVisInfo.value) return {}
  const vi = imageVisInfo.value
  const topRel = cropRect.value.y / vi.scaleY + vi.offYPct
  const heightRel = cropRect.value.h / vi.scaleY
  const rightRel = 1 - ((cropRect.value.x + cropRect.value.w) / vi.scaleX + vi.offXPct)
  return { top: `${topRel * 100}%`, right: 0, width: `${rightRel * 100}%`, height: `${heightRel * 100}%` }
})
const cropBoxStyle = computed(() => {
  if (!cropRect.value || !imageVisInfo.value) return {}
  const vi = imageVisInfo.value
  return {
    top: `${(cropRect.value.y / vi.scaleY + vi.offYPct) * 100}%`,
    left: `${(cropRect.value.x / vi.scaleX + vi.offXPct) * 100}%`,
    width: `${(cropRect.value.w / vi.scaleX) * 100}%`,
    height: `${(cropRect.value.h / vi.scaleY) * 100}%`,
  }
})

function triggerCamera() {
  cameraInput.value?.click()
}

function triggerUpload() {
  fileInput.value?.click()
}

function getRelativePos(e) {
  const el = previewContainer.value
  if (!el || !imageVisInfo.value) {
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
  }
  const vi = imageVisInfo.value
  const rect = el.getBoundingClientRect()
  // 将鼠标位置映射到可见图片区域内的 0~1 坐标
  const rawX = (e.clientX - rect.left) / rect.width
  const rawY = (e.clientY - rect.top) / rect.height
  return {
    x: Math.max(0, Math.min(1, (rawX - vi.offXPct) * vi.scaleX)),
    y: Math.max(0, Math.min(1, (rawY - vi.offYPct) * vi.scaleY)),
  }
}

function onCropStart(e) {
  if (ocrLoading.value) return
  // 阻止默认行为（防止图片拖拽），但保留 pointer capture 机制
  e.preventDefault()
  const pos = getRelativePos(e)
  cropStart.value = pos
  cropDragging.value = true
  cropRect.value = null
  // 捕获指针：确保 pointermove/pointerup 始终发送到此元素，即使鼠标移出元素边界
  previewContainer.value?.setPointerCapture(e.pointerId)
}

function onCropMove(e) {
  if (!cropDragging.value) return
  const pos = getRelativePos(e)
  const sx = cropStart.value.x
  const sy = cropStart.value.y
  const cx = Math.max(0, Math.min(1, pos.x))
  const cy = Math.max(0, Math.min(1, pos.y))
  cropRect.value = {
    x: Math.min(sx, cx),
    y: Math.min(sy, cy),
    w: Math.abs(cx - sx),
    h: Math.abs(cy - sy),
  }
}

function onCropEnd(e) {
  if (!cropDragging.value) return
  cropDragging.value = false
  // 释放指针捕获
  previewContainer.value?.releasePointerCapture?.(e?.pointerId)
  // 裁剪区域过小（可能只是点击）→ 清除
  if (cropRect.value && (cropRect.value.w < 0.01 || cropRect.value.h < 0.01)) {
    cropRect.value = null
  }
}

function resetCrop() {
  cropRect.value = null
}

/** 图片被选中后：预览 + 进入裁剪模式（不立即识别） */
async function onImagePicked(e) {
  const file = e.target.files?.[0]
  if (!file) return

  originalFile.value = file
  ocrResult.value = null
  ocrResultGroups.value = []
  ocrNeedFix.value = false
  ocrFixApplied.value = false
  cropRect.value = null
  imageVisInfo.value = null

  // 预览
  const reader = new FileReader()
  reader.onload = (ev) => { capturedImage.value = ev.target.result }
  reader.readAsDataURL(file)

  // 重置 file input
  e.target.value = ''
}

/** 裁剪 + 预处理 + OCR */
async function runCropOCR() {
  if (!cropRect.value || cropTooSmall.value || !capturedImage.value) return
  // 裁剪区域经框选后噪声可控：灰度化即可，保留灰度层次给 tesseract
  await doOCRWithImage(capturedImage.value, cropRect.value)
}

/** 整图预处理 + OCR */
async function runFullOCR() {
  if (!originalFile.value) return
  // 整图噪声多：灰度 + 轻度对比度增强
  await doOCRWithImage(originalFile.value, { x: 0, y: 0, w: 1, h: 1 }, { grayscale: true, contrast: 1.15 })
}

/** 核心 OCR 流程：预处理 → tesseract → 解析 */
async function doOCRWithImage(src, rect, preprocessOpts = {}) {
  ocrLoading.value = true
  let worker = null

  try {
    // 1) Canvas 预处理（裁剪 + 增强）
    let inputBlob
    try {
      inputBlob = await cropAndPreprocess(src, rect, preprocessOpts)
    } catch (preErr) {
      console.warn('图片预处理失败，回退到原始图片:', preErr)
      inputBlob = originalFile.value
    }

    // 2) tesseract.js OCR（使用 createWorker API 以获得 PSM 参数控制）
    const Tesseract = await import('tesseract.js')
    worker = await Tesseract.createWorker('chi_sim+eng')

    await worker.setParameters({
      // PSM 6: 假设单一均匀文本块，适合彩票行结构
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    })

    const { data } = await worker.recognize(inputBlob)

    const text = data.text
    console.log('OCR 识别文本:', text)

    // 3) 解析
    handleOCRResult(text)
  } catch (e) {
    console.error('OCR 识别失败:', e)
    errorMsg.value = 'OCR 识别失败，请重试或切换为手动输入'
  } finally {
    if (worker) {
      try { await worker.terminate() } catch (_) { /* ignore */ }
    }
    ocrLoading.value = false
  }
}

/** 解析 OCR 文本并更新组件状态 */
async function handleOCRResult(text) {
  const groups = parseOCRText(text) || []
  if (groups.length > 0) {
    ocrResultGroups.value = groups
    const parsed = groups[0]
    ocrResult.value = parsed
    if (parsed.issue) {
      if (issueList.value.length === 0) await loadIssueList()
      let matchIssue = issueList.value.find(i => i.issue === parsed.issue)
      if (!matchIssue) {
        matchIssue = issueList.value.find(
          i => i.issue.includes(parsed.issue) || parsed.issue.includes(i.issue)
        )
      }
      if (matchIssue) {
        selectedIssue.value = matchIssue.issue
        drawResult.value = matchIssue
        if (matchIssue.reds) lotteryType.value = 'ssq'
        else if (matchIssue.fronts) lotteryType.value = 'dlt'
      } else {
        selectedIssue.value = parsed.issue
        if (parsed.type) {
          lotteryType.value = parsed.type
          try {
            const draw = await fetchDrawByIssue(parsed.issue, parsed.type)
            if (draw) drawResult.value = draw
          } catch (e) { console.warn('获取OCR期号对应开奖数据失败:', e) }
        }
      }
    }
    const nums = parsed.numbers
    if (parsed.type === 'ssq') {
      ocrNeedFix.value = !nums.reds || nums.reds.length < 6 || nums.blue == null
      if (nums.reds) ocrFixSSQ.value = [...nums.reds].join(',') + '+' + (nums.blue || '')
    } else {
      ocrNeedFix.value = !nums.fronts || nums.fronts.length < 5 || !nums.backs || nums.backs.length < 2
      if (nums.fronts && nums.backs) ocrFixDLT.value = [...nums.fronts].join(',') + '+' + [...nums.backs].join(',')
    }
    if (!ocrNeedFix.value) ocrFixApplied.value = true
  } else {
    ocrNeedFix.value = true
  }
}

/**
 * 解析 OCR 文本，提取号码
 *
 * 彩票票面通常格式：
 *   双色球：红球：01 05 12 18 22 30    蓝球：07
 *   大乐透：前区：03 08 15 22 31    后区：05 09
 *
 * OCR 噪音来源：
 *   1. 十六进制字符串（730A-4E64-11B4 → 拆分出 4,11,9,14 等）
 *   2. 日期/期号/流水号/金额
 *   3. OCR 粘连（02 被误读为 102）
 */
function parseOCRText(text) {
  let raw = text.replace(/[\s\n\r]+/g, ' ').trim()

  // 【预处理1】拆分 OCR 粘连的多位数字序列（必须在清洗前做，否则长数字会被移除）
  //   SSQ 票面常见：9161822→09 16 18 22, 512→05 12, 81011→08 10 11, 1315231→13 15 23 1
  //   策略：优先从右往左按2位切（SSQ 蓝球在末尾），失败则从左往右回退（处理 52 等中间数字超限情况）
  raw = raw.replace(/\b(\d{3,})\b/g, (m, digits) => {
    const L = digits.length
    const valid1to35 = s => { const n = Number(s); return n >= 1 && n <= 35 }

    // 策略1：从右往左 2 位切分
    const rtl = []
    let pos = L; let okRTL = true
    while (pos >= 2) {
      const pair = digits.substring(pos - 2, pos)
      if (valid1to35(pair)) { rtl.unshift(pair); pos -= 2 }
      else { okRTL = false; break }
    }
    if (okRTL && pos === 1 && Number(digits[0]) >= 1 && Number(digits[0]) <= 9) rtl.unshift(digits[0])
    if (okRTL && rtl.length >= 2) return rtl.join(' ')

    // 策略2（回退）：从左往右 2 位切分（处理 1315231 等右切失败场景）
    const ltr = []
    let i = 0; let okLTR = true
    while (i + 1 < L) {
      const pair = digits.substring(i, i + 2)
      if (valid1to35(pair)) { ltr.push(pair); i += 2 }
      else { okLTR = false; break }
    }
    if (okLTR && i === L - 1 && Number(digits[L - 1]) >= 1 && Number(digits[L - 1]) <= 9) ltr.push(digits[L - 1])
    if (okLTR && ltr.length >= 2) return ltr.join(' ')

    return m // 两种策略都失败，保留原样
  })

  // 【预处理2】后区粘连修复（DLT 后区常见 0510→05 10, 0607→06 07）
  raw = raw.replace(/\b(\d{2})(\d{2})\b/g, (m, a, b) => {
    const n1 = Number(a), n2 = Number(b)
    if (n1 >= 1 && n1 <= 12 && n2 >= 1 && n2 <= 12) {
      return a + ' ' + b
    }
    return m
  })

  console.log('[OCR] 原始文本:', raw)

  // ===== 0. 修复 OCR 空格拆分 =====
  // 0a. 期号数字被空格拆开：第 25 07 4 期 → 第25074期
  raw = raw.replace(/第\s+(\d[\d\s]*?\d)\s+期/g, (_, digits) => '第' + digits.replace(/\s+/g, '') + '期')
  // 0b. 销售期/开奖期 格式（无"第"前缀）：期 :2 02 21 19 → 附加 第2022119期 供后续匹配
  //   【关键】用贪婪匹配 (\d(?:\s*\d)*) 捕获全部空格稀释的数字，不用 lazy+boundary
  raw = raw.replace(/(?:销售|开奖)\s*期\s*:?\s*(\d(?:\s*\d)*)/gi, (m, digits) => {
    const num = digits.replace(/\s+/g, '')
    return m + ' 第' + num + '期'
  })

  // ===== 1. 提取期号 =====
  let issue = ''
  // 优先：第 + 5~7位数字（兼容 SSQ 7位如 2022119 和 DLT 5~6位如 25074/250128）
  //   使用 \b 边界避免把后面的日期数字（如 2025402）吞进来
  const issueFullMatch = raw.match(/第\s*(\d{5,7})\b/)
    || raw.match(/#\s*(\d{5,7})\b/)
    || raw.match(/开?奖?\s*期\s*[;:：\s]+(\d{5,7})\b/)
  if (issueFullMatch) {
    issue = issueFullMatch[1]
    // OCR合并修复：票面 "25012 8"（月08日）可能被OCR粘成 "250128"
    //   检测期号附近有 "月\d{1,2}日" 模式，且期号末尾与日数字相同 → 裁掉合并的日数字
    const dateContext = raw.match(/月\s*(\d{1,2})\s*日/)
    if (dateContext && issue.length > 5) {
      const dayNum = dateContext[1]
      // 从期号末尾逐位检查是否重叠了日期数字
      for (let trimLen = dayNum.length; trimLen >= 1; trimLen--) {
        const suffix = dayNum.slice(0, trimLen)
        if (issue.endsWith(suffix)) {
          const trimmed = issue.slice(0, -suffix.length)
          if (trimmed.length >= 5) {
            issue = trimmed
            break
          }
        }
      }
    }
  } else {
    // 回退1：SSQ 期号 — 7位数字以 20 开头（如 2024003）
    const ssqFallback = raw.match(/\b(20\d{5})\b/)
    if (ssqFallback) issue = ssqFallback[1]

    // 回退2：DLT 期号 — 5~6位数字以 25 开头（如 25074、250128）
    if (!issue) {
      const dltFallback = raw.match(/\b(25\d{3,4})\b/)
      // 排除明显是年份的概率（25 开头后面接日期连字符的概率）
      if (dltFallback && !raw.includes(dltFallback[1] + '-')) {
        issue = dltFallback[1]
      }
    }

    // 回退3：纯数字模式 — 匹配紧邻日期格式前的 5~7 位数字（期号常出现在日期左边）
    //   例："2024003 24-01-01" → 提取 2024003
    if (!issue) {
      const contextIssue = raw.match(/\b(\d{5,7})\s+\d{2}-\d{2}-\d{2}\b/)
        || raw.match(/\b(\d{5,7})\s+\d{4}-\d{1,2}-\d{1,2}\b/)
      if (contextIssue) issue = contextIssue[1]
    }
  }
  // OCR合并修复2：期号过长（≥7位且以25开头=DLT年），尝试截断到标准格式
  //   例：#2505044) → 2505044 → 只取前5位 → 25050（DLT标准5位）
  if (issue && issue.length >= 7 && /^25/.test(issue)) {
    const short = issue.slice(0, 5)
    console.log('[OCR] 期号截断:', issue, '→', short)
    issue = short
  }
  console.log('[OCR] 期号:', issue || '未识别')

  // ===== 2. 优先：通过标签精确提取号码 =====
  const ssqRedLabel = raw.match(/红球[：:\s]*([\d\s,，、]+)/i)
  const ssqBlueLabel = raw.match(/蓝球[：:\s]*(\d{1,2})/i)
  const dltFrontLabel = raw.match(/前区[：:\s]*([\d\s,，、]+)/i)
  const dltBackLabel = raw.match(/后区[：:\s]*([\d\s,，、]+)/i)

  if (ssqRedLabel) {
    const redNums = extractNumbers(ssqRedLabel[1], 1, 33)
    const blueNum = ssqBlueLabel ? Number(ssqBlueLabel[1]) : null
    console.log('[OCR] 标签-双色球 红:', redNums, '蓝:', blueNum)
    if (redNums.length >= 6 && blueNum && blueNum >= 1 && blueNum <= 16) {
      return [{ type: 'ssq', issue, numbers: { reds: redNums.slice(-6).sort((a, b) => a - b), blue: blueNum } }]
    }
  }

  if (dltFrontLabel) {
    const frontNums = extractNumbers(dltFrontLabel[1], 1, 35)
    const backNums = dltBackLabel ? extractNumbers(dltBackLabel[1], 1, 12) : []
    console.log('[OCR] 标签-大乐透 前:', frontNums, '后:', backNums)
    if (frontNums.length >= 5 && backNums.length >= 2) {
      return [{ type: 'dlt', issue, numbers: { fronts: frontNums.slice(-5).sort((a, b) => a - b), backs: backNums.slice(-2).sort((a, b) => a - b) } }]
    }
  }

  // ===== 3. 全文解析：先强力去噪，再提取 =====
  let clean = raw

  // 3.0-pre1 【必须在 -→+ 前】清理 UUID/hex 混合连字符串
  //   例：30A-4564-1184-46C9-B4E4-AF14-0F08 → 含字母的 hex 段不会被纯数字 pre2 匹配，
  //   但若等到 3.0 后 - 变 +，3.1 hex 清理就无法匹配完整 UUID 了（+ 不匹配 [-]）
  //   {3,} 要求至少 4 段（1+3），避免误伤彩票的 24-1 两段格式
  clean = clean.replace(/\b[A-Fa-f0-9]+(?:-[A-Fa-f0-9]+){3,}\b/g, ' ')
  //   清理类似 5173B49C-2ABA2BF（只有 2 段但含长 hex 字母）的风格
  clean = clean.replace(/\b(?=.*[A-Fa-f])[A-Fa-f0-9]{4,}-[A-Fa-f0-9]{4,}\b/g, ' ')

  // 3.0-pre2 【必须在 -→+ 前】清理长连字符流水号/条码（纯数字版）
  //   例：110370-174681-113006-856444 → 防止 81-11 被转为 81 + 11 产生幽灵 +
  //   匹配 ≥4 位数字间用 - 连接的序列（彩票号码最多 2 位，流水号 ≥4 位）
  clean = clean.replace(/\b\d{4,}(?:-\d{4,}){1,}\b/g, ' ')
  //   清理短—长连接（如 18-083057-101，前段可能是 1~3 位号码但后段是流水号）
  clean = clean.replace(/\b\d{1,3}-\d{4,}(?:-\d+)?\b/g, ' ')
  //   清理残留孤立连字符
  clean = clean.replace(/\s*-\s*(?=\d{4,})/g, ' ')

  // 3.0-pre3 【必须在 -→+ 前】修复紧凑 + 格式：OCR 可能漏空格（30+16 → 30 + 16）
  clean = clean.replace(/(\d)\+(\d)/g, '$1 + $2')

  // 3.0-pre2 【必须在 -→+ 前】清理含 - 的时间戳（HH-MM:SS 格式）
  //   例：18-13;:53;41 → 不在此阶段清理会导致 18-13 被转为 18 + 13 产生幽灵 +
  //   [;:：\-]+ 兼容 OCR 混用的分号/冒号/连字符
  clean = clean.replace(/\b\d{1,2}-\d{1,2}(?:[;:：\-]+\d{1,2})+\b/g, ' ')

  // 3.0-pre 【必须在 -→+ 前】清理日期连字符，防止日期被错误转换为幽灵 +
  //   例：2024003 24-01-01 → 保留期号 2024003，移除 24-01-01
  //   不在此阶段清理会导致 24-01 → 24 + 01，凭空多出一个 + 分隔符
  clean = clean.replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, ' ')  // YYYY-MM-DD
  clean = clean.replace(/\b\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])\b/g, ' ')  // YY-MM-DD（月份01-12，日期01-31）

  // 3.0 【必须在去噪前】统一分隔符：部分票面用 - 分隔蓝球/后区（如 24-1, 25-13, 32-15）
  //   必须在十六进制清理前执行！否则 [0-9A-Fa-f]+-[0-9A-Fa-f]+ 会把合法号码对当 hex 吞掉
  //   只匹配 1~2 位纯数字，hex 串（含字母或多位）不受影响
  clean = clean.replace(/(\d{1,2})\s*-\s*(\d{1,2})/g, '$1 + $2')

  // 3.0b 检测无显式分隔符的号码组（OCR 漏识别 -/+ 号时）
  //   例：B. 4 6 9 16 21 25 13 → 4 6 9 16 21 25 + 13
  //   【关键安全1】禁止跨越已有 + 边界：前面 3 字符内有 + 说明这是上一组的后区尾号
  //   【关键安全2】前面含字母说明首个数字可能是行号/序号（如 r 1 → 1 是噪音），
  //     若丢弃首数字后剩余 6 个都是合法红球，则首数字确为噪音，不应插 +
  clean = clean.replace(
    /\b(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\b/g,
    (m, a, b, c, d, e, f, g, offset) => {
      // 前面含 + 说明这 7 连号跨了组边界，不能插 +
      const before = clean.substring(Math.max(0, offset - 3), offset)
      if (/\+/.test(before)) return m
      const nums = [a, b, c, d, e, f, g].map(Number)
      if (!nums.every(n => n >= 1 && n <= 35)) return m
      // 前面含字母 → 首个数字可能是行号，丢首数字后若剩余 6 个都是 1-33 合法红球则保持原样
      if (/[A-Za-z]/.test(before)) {
        const rest = [b, c, d, e, f, g].map(Number)
        if (rest.every(n => n >= 1 && n <= 33)) return m
      }
      return `${a} ${b} ${c} ${d} ${e} ${f} + ${g}`
    }
  )

  // 3.0c 清理 SSQ 票面每行蓝球后的注数标记（1 注 / 1 倍）
  //   票面格式：...红球 + 蓝球 1   下一组...
  //   只匹配 +蓝球 后紧跟的孤立 1，不误伤 DLT 双后区格式（+ 06 09 不会被匹配）
  clean = clean.replace(/(\+\s*\d{1,2})\s+1\b(?=\s|$)/g, '$1')

  // 3.1 【关键】移除十六进制/混合字母数字串（最大的噪音来源）
  // 形如 730A-4E64-11B4-46C9-BAE4-AF 14-0F 0B
  // 注意：这里有带空格的和不带空格的两种格式
  // 【重要】纯数字串（如 0510=05和10粘连）不能删 — 必须含至少一个字母才算十六进制
  // 【重要】- 已在 3.0 统一为 +，此处只清理含字母的 hex 串；纯数+-数已被保护
  clean = clean.replace(/[A-Fa-f0-9]{2,}[-][A-Fa-f0-9]{2,}([-][A-Fa-f0-9]{2,})*/g, ' ')
  clean = clean.replace(/\b(?=.*[A-Fa-f])[A-Fa-f0-9]{4,}\b/g, ' ')  // 必须含字母才是真十六进制
  clean = clean.replace(/[0-9A-Fa-f]+[-][0-9A-Fa-f]+/g, ' ')  // 含-的十六进制（此时只剩含字母的）

  // 3.2 移除日期
  clean = clean.replace(/\d{4}[\/\-\.年]\d{1,2}[\/\-\.月]\d{1,2}[日]?/g, ' ')
  clean = clean.replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/g, ' ')

  // 3.3 移除期号
  if (issue) clean = clean.replace(issue, ' ')

  // 3.4 移除长数字（7位以上）
  clean = clean.replace(/\b\d{7,}\b/g, ' ')

  // 3.5 移除年份数字
  clean = clean.replace(/\b20\d{2}\b/g, ' ')

  // 3.6 移除金额相关数字（CJK 字符后 \b 不生效，用更宽松的匹配）
  clean = clean.replace(/\d+\.\d+\s*元/g, ' ')  // 10.00 元
  clean = clean.replace(/合计\s*\d+\s*元/g, ' ') // 合计 4 元 → 必须在标签清理前整体移除
  clean = clean.replace(/\d+\s*元/g, ' ')        // 10 元（无条件匹配：\b 在 CJK 前后失效）
  clean = clean.replace(/\d+\s*合计/g, ' ')       // 11 合计

  // 3.7 移除时间戳（处理混杂分隔符如 13;:53;41 或 13-53:41）
  clean = clean.replace(/\d{1,2}[;:：\-]+\d{1,2}[;:：\-]+\d{1,2}/g, ' ')
  // 二次清理：移除日期中的独立数字残留（如 /10/18 被拆成 10 18）
  clean = clean.replace(/\/\d{1,2}\/\d{1,2}/g, ' ')
  // 三次清理：移除日期格式 2022/10/18 残留（处理 OCR 断词导致的匹配失败）
  clean = clean.replace(/\d{4}\s*\/\s*\d{1,2}\s*\/\s*\d{1,2}/g, ' ')
  // 四次清理：移除日期残余片段（如 20 22/ → 时间戳移除后留下的年份+斜杠碎片）
  clean = clean.replace(/\d{2,4}\s*\/\s*/g, ' ')

  // 3.8 移除标签文字
  const labels = ['双色球', '大乐透', '红球', '蓝球', '前区', '后区', '期号', '开奖',
    '金额', '合计', '倍数', '注数', '流水号', '站号', '销售期', '销售时间',
    '开奖日期', '玩法', '单式', '复式', '感谢', '公益', '事业', '贡献',
    '福利彩票', '彩票', '管理中心', '承销', '浙江省', '省', '中心', '依数']
  labels.forEach(l => { clean = clean.replace(new RegExp(l, 'g'), ' ') })

  // 3.9 移除常见符号和英文字母
  clean = clean.replace(/[;:：。，,、$#@¥（）()【】\[\]=|!{}<>&%°*"'\/\\~]/g, ' ')
  // 清理彩票票据条目分隔符号（®、© 等）
  clean = clean.replace(/[®©™•▪▸►●○]/g, ' ')
  clean = clean.replace(/[A-Za-z]+/g, ' ')

  // 3.10 【安全网】清理幽灵 + 号（后不跟数字的 + — 来自时间戳/日期 -→+ 转换的残留）
  clean = clean.replace(/\+\s*(?![0-9])/g, ' ')
  // 清理连续多余空格
  clean = clean.replace(/\s+/g, ' ')

  console.log('[OCR] 清理后文本:', clean.trim())

  // ===== 4.【关键】利用 + 分隔符定位号码区，支持多组 =====
  // 双色球票面典型格式：02 09 10 16 28 30+16 或 02 09 10 16 28 30 + 16
  // 大乐透票面典型格式：03 08 15 22 31+05 09 或 03 08 15 22 31 + 05 09
  // 多组票面：02 09 10 16 28 30 + 16   05 12 18 22 27 33 + 08
  // 注意：DLT 双后区格式 + 09 10 → 必须同时捕获两个数字，否则 10 泄漏到下一组
  const plusMatches = [...clean.matchAll(/\+\s*(\d{1,2})(?:\s*(\d{1,2}))?/g)]
  if (plusMatches.length > 0) {
    const results = []
    const hasSSQLabel = /双色球|ssq/i.test(raw)
    const hasDLTLabel = /大乐透|dlt/i.test(raw)
    // 窗口大小：6个红球约18字符，20留少量余量
    const WINDOW = 20

    for (let i = 0; i < plusMatches.length; i++) {
      // 后区数字：第1个（必有），第2个（DLT 双后区可选）
      const blue1 = Number(plusMatches[i][1])
      const blue2 = plusMatches[i][2] != null ? Number(plusMatches[i][2]) : null
      const hasTwoBacks = blue2 !== null && blue2 >= 1 && blue2 <= 12
      const plusPos = plusMatches[i].index
      // 完整匹配末尾（DLT 含双后区时比 +蓝球 更长，用作下组边界）
      const matchEnd = plusMatches[i].index + plusMatches[i][0].length

      // 确定红球/前区数字列表
      let rawBeforeNums

      if (i === 0) {
        // 第一组：用 20 字符窗口
        const beforeWindow = clean.substring(Math.max(0, plusPos - WINDOW), plusPos)
        rawBeforeNums = (beforeWindow.match(/\d+/g) || []).map(Number)
        console.log(`[OCR] 第${i + 1}组 窗口文本:`, beforeWindow.trim(), '→ raw:', rawBeforeNums, 'blue1:', blue1, 'blue2:', blue2)
      } else {
        // 后续组：取上一组完整匹配末尾到当前 + 之间的数字
        const prevMatchEnd = plusMatches[i - 1].index + plusMatches[i - 1][0].length
        const segment = clean.substring(prevMatchEnd, plusPos)
        rawBeforeNums = (segment.match(/\d+/g) || []).map(Number)
        console.log(`[OCR] 第${i + 1}组 段间文本:`, segment.trim(), '→ raw:', rawBeforeNums, 'blue1:', blue1, 'blue2:', blue2)
      }

      // 粘连修复 + 范围过滤
      let beforeNums = rawBeforeNums
        .map(n => fixGluedNumber(n, 35))
        .filter(n => n >= 1 && n <= 35)

      // 后区数字修复
      const blue1Fixed = fixGluedNumber(blue1, 16)
      const blue2Fixed = blue2 !== null ? fixGluedNumber(blue2, 12) : null

      // 【安全兜底】如果数字过多，保留最后N个
      const knownType = results.length > 0 ? results[0].type : null
      const maxKeep = knownType === 'dlt' ? 5 : 7
      if (beforeNums.length > maxKeep) {
        beforeNums = beforeNums.slice(-maxKeep)
      }

      const uniqNums = [...new Set(beforeNums)]
      console.log(`[OCR] 第${i + 1}组 afterFix:`, uniqNums, 'backs:', [blue1Fixed, blue2Fixed], 'typeHint:', knownType)

      // === DLT 优先判定：双后区格式 或 DLT 标签 + 5前区 ===
      if (!hasSSQLabel && uniqNums.length >= 5) {
        let backs = []

        if (hasTwoBacks && blue2Fixed >= 1 && blue2Fixed <= 12) {
          // 直接从捕获组取双后区（最优路径：避免从后续文本捞数字）
          backs = [blue1Fixed, blue2Fixed].sort((a, b) => a - b)
        } else {
          // 单后区格式但可能是 DLT：从 + 后上下文取数字
          const afterPlus = clean.substring(plusPos, Math.min(matchEnd + 10, clean.length))
          const backsInAfter = (afterPlus.match(/\d+/g) || [])
            .map(Number)
            .flatMap(n => splitGluedNumbers(n, 12))
            .filter(n => n >= 1 && n <= 12)
          backs = [...new Set(backsInAfter)].slice(0, 2).sort((a, b) => a - b)
        }

        if (backs.length >= 2) {
          results.push({
            type: 'dlt', issue,
            numbers: { fronts: uniqNums.slice(-5).sort((a, b) => a - b), backs },
          })
          continue
        }
      }

      // === SSQ 判定：≥6个红球候选 + 单蓝球 ===
      if (uniqNums.length >= 6 && blue1Fixed >= 1 && blue1Fixed <= 16 && !hasDLTLabel) {
        results.push({
          type: 'ssq', issue,
          numbers: { reds: uniqNums.slice(-6).sort((a, b) => a - b), blue: blue1Fixed },
        })
        continue
      }
    }

    if (results.length > 0) {
      console.log('[OCR] 多组解析完成，共', results.length, '组')
      return results
    }
    console.log('[OCR] +号解析 无法匹配任何有效组')
  }

  // ===== 5. 无+号，全文提取 =====
  const rawNums = clean.match(/\d+/g)
  if (!rawNums || rawNums.length < 3) {
    console.log('[OCR] 数字不足')
    return null
  }

  const allNums = rawNums.map(Number)
    .map(n => fixGluedNumber(n, 35))
    .filter(n => n >= 1 && n <= 35)

  console.log('[OCR] 有效数字(1-35):', allNums)

  // ===== 6. 智能判定彩种 =====
  const uniqueReds = [...new Set(allNums.filter(n => n >= 1 && n <= 33))]
  const uniqueBlues = [...new Set(allNums.filter(n => n >= 1 && n <= 16))]
  const uniqueFronts = [...new Set(allNums.filter(n => n >= 1 && n <= 35))]
  const uniqueBacks = [...new Set(allNums.filter(n => n >= 1 && n <= 12))]

  console.log('[OCR] SSQ候选 红:', uniqueReds, '蓝:', uniqueBlues)
  console.log('[OCR] DLT候选 前:', uniqueFronts, '后:', uniqueBacks)

  const hasSSQLabel = /双色球|ssq/i.test(raw)

  if (uniqueReds.length >= 6) {
    const redPicks = uniqueReds.slice(0, 6).sort((a, b) => a - b)
    let bluePick = uniqueBlues.find(b => !redPicks.includes(b))
    if (!bluePick) bluePick = uniqueBlues[0]
    if (bluePick && bluePick >= 1 && bluePick <= 16) {
      return [{ type: 'ssq', issue, numbers: { reds: redPicks, blue: bluePick } }]
    }
  }

  // 仅在没有明确双色球标签时才降级判断大乐透
  if (!hasSSQLabel && uniqueFronts.length >= 5 && uniqueBacks.length >= 2) {
    const frontPicks = uniqueFronts.slice(0, 5).sort((a, b) => a - b)
    const backPicks = (uniqueBacks.filter(b => !frontPicks.includes(b)).length >= 2
      ? uniqueBacks.filter(b => !frontPicks.includes(b))
      : uniqueBacks).slice(0, 2).sort((a, b) => a - b)
    return [{ type: 'dlt', issue, numbers: { fronts: frontPicks, backs: backPicks } }]
  }

  console.log('[OCR] 无法解析出有效号码组合')
  return null
}

/**
 * 修复 OCR 粘连数字：102→2, 110→10, 128→28, 372→32（中间插入噪音）等
 * @param {number} n 原始数字
 * @param {number} maxRange 有效范围上限
 * @returns {number} 修复后的数字
 */
function fixGluedNumber(n, maxRange) {
  if (n >= 1 && n <= maxRange) return n
  const s = String(n)

  // 策略1：去除前缀数字（如 102→2, 110→10, 128→28），优先保留 2 位数
  //  先找 ≥10 的（大概率是真实号码），找不到再找单数
  let best = null
  for (let cut = 1; cut < s.length; cut++) {
    const v = Number(s.slice(cut))
    if (v >= 10 && v <= maxRange) { best = v; break }
  }
  if (!best) {
    for (let cut = 1; cut < s.length; cut++) {
      const v = Number(s.slice(cut))
      if (v >= 1 && v <= maxRange) { best = v; break }
    }
  }

  // 策略2：去除后缀数字
  for (let cut = 1; cut < s.length; cut++) {
    const v = Number(s.slice(0, s.length - cut))
    if (v >= 10 && v <= maxRange && (!best || v > best)) { best = v; break }
  }

  // 策略3：首尾拼合（OCR 在中间插入了噪音数字，如 372→32, 160→10）
  if (s.length >= 3) {
    const fl = Number(s[0] + s[s.length - 1])
    if (fl >= 10 && fl <= maxRange) best = fl
  }

  if (best) {
    console.log('[OCR] 修复粘连:', n, '→', best)
    return best
  }
  return n
}

/**
 * 处理粘连的后区数字（如 0510 → [05, 10]，0607 → [06, 07]）
 * 尝试所有可能的切分点，返回切分后都合法的数对
 */
function splitGluedNumbers(n, maxRange) {
  if (n >= 1 && n <= maxRange) return [n]
  const s = String(n)
  // 尝试在每个位置切分
  for (let cut = 1; cut < s.length; cut++) {
    const left = Number(s.slice(0, cut))
    const right = Number(s.slice(cut))
    if (left >= 1 && left <= maxRange && right >= 1 && right <= maxRange) {
      console.log('[OCR] 拆分粘连后区:', n, '→', left, right)
      return [left, right]
    }
  }
  // 无法拆分为两个有效数，回退到单数修复
  return [fixGluedNumber(n, maxRange)]
}

/**
 * 从文本片段中提取去重的数字
 */
function extractNumbers(fragment, min, max) {
  return [...new Set(
    (fragment.match(/\d+/g) || [])
      .map(Number)
      .map(n => fixGluedNumber(n, max))
      .filter(n => n >= min && n <= max)
  )]
}

function applyFix() {
  if (ocrResult.value?.type === 'ssq') {
    const parts = ocrFixSSQ.value.split('+')
    const redsStr = (parts[0] || '').split(/[,，\s]+/).map(Number).filter(n => n >= 1 && n <= 33)
    const blueStr = Number(parts[1]) || 0
    if (redsStr.length >= 6 && blueStr >= 1 && blueStr <= 16) {
      ocrResult.value = {
        ...ocrResult.value,
        numbers: {
          reds: [...new Set(redsStr)].slice(0, 6).sort((a, b) => a - b),
          blue: blueStr,
        },
      }
      ocrNeedFix.value = false
      ocrFixApplied.value = true
      errorMsg.value = ''
    } else {
      errorMsg.value = '格式不正确，请按 "红球,红球...+蓝球" 格式输入，如: 01,05,12,18,22,30+07'
    }
  } else {
    const parts = ocrFixDLT.value.split('+')
    const frontsStr = (parts[0] || '').split(/[,，\s]+/).map(Number).filter(n => n >= 1 && n <= 35)
    const backsStr = (parts[1] || '').split(/[,，\s]+/).map(Number).filter(n => n >= 1 && n <= 12)
    if (frontsStr.length >= 5 && backsStr.length >= 2) {
      ocrResult.value = {
        ...ocrResult.value,
        numbers: {
          fronts: [...new Set(frontsStr)].slice(0, 5).sort((a, b) => a - b),
          backs: [...new Set(backsStr)].slice(0, 2).sort((a, b) => a - b),
        },
      }
      ocrNeedFix.value = false
      ocrFixApplied.value = true
      errorMsg.value = ''
    } else {
      errorMsg.value = '格式不正确，请按 "前区,前区...+后区,后区" 格式输入，如: 03,08,15,22,31+05,09'
    }
  }
}
</script>

<style lang="scss" scoped>
// ========== 变量 ==========
$bg: #f1f5f9;
$card-bg: #ffffff;
$text-primary: #0f172a;
$text-secondary: #475569;
$text-muted: #94a3b8;
$border: #e2e8f0;
$radius-sm: 12px;
$radius-md: 16px;
$radius-lg: 20px;

.win-query-panel {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}

// ========== 输入模式切换 ==========
.input-mode-section {
  margin-bottom: 24px;
}
.mode-tabs {
  display: flex;
  gap: 10px;
}
.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1.5px solid $border;
  background: $card-bg;
  color: $text-secondary;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  &.active {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
  }
}

// ========== 手动输入 ==========
.manual-section {
  background: $card-bg;
  border-radius: $radius-lg;
  padding: 20px;
  border: 1px solid $border;
  margin-bottom: 24px;
}

// 期号选择
.issue-select-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  .input-label {
    font-size: 13px;
    font-weight: 600;
    color: $text-secondary;
    white-space: nowrap;
  }
  .issue-select {
    flex: 1;
    max-width: 300px;
  }
}

// 号码选择器
.number-group {
  margin-bottom: 18px;
  &:last-child { margin-bottom: 0; }
}
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.group-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  &.front-dot { background: #dc3545; }
  &.back-dot { background: #3b82f6; }
}
.group-title {
  font-size: 14px;
  font-weight: 700;
  color: $text-primary;
}
.group-hint {
  font-size: 11px;
  color: $text-muted;
}
.ball-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.picker-ball {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    border-color: #94a3b8;
    transform: scale(1.08);
  }
  &.selected {
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  &.front-ball.selected {
    background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%);
  }
  &.back-ball.selected {
    background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%);
  }
}

// 彩种切换
.type-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border;
  .type-hint {
    font-size: 13px;
    color: $text-secondary;
  }
}
.type-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: 1.5px solid $border;
  background: #fff;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  .type-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    &.red { background: #dc3545; }
    &.purple { background: #8b5cf6; }
  }
  &.active {
    border-color: #667eea;
    color: #667eea;
    background: #f5f3ff;
  }
  &:hover { border-color: #94a3b8; }
}

// ========== 拍照识别 ==========
.camera-section {
  background: $card-bg;
  border-radius: $radius-lg;
  padding: 20px;
  border: 1px solid $border;
  margin-bottom: 24px;
}
.camera-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.camera-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: $radius-md;
  font-size: 14px;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #667eea;
    color: #667eea;
    background: #f5f3ff;
  }
}

// 预览区域
.preview-area {
  position: relative;
  border-radius: $radius-sm;
  overflow: hidden;
  margin-bottom: 16px;
  background: #f1f5f9;
}
.crop-wrapper {
  position: relative;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.preview-img {
  width: 100%;
  max-height: 350px;
  object-fit: contain;
  display: block;
  pointer-events: none;  // 让事件穿透到 wrapper
}
// 裁剪遮罩（半透明暗区）
.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
  z-index: 2;
}
// 裁剪框（清除区域 + 白色虚线边框）
.crop-box {
  position: absolute;
  border: 2px dashed #fff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 3;
  pointer-events: none;
}
// 裁剪框四角标记
.crop-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 2px;
  &.tl { top: -4px; left: -4px; border-right: none; border-bottom: none; }
  &.tr { top: -4px; right: -4px; border-left: none; border-bottom: none; }
  &.bl { bottom: -4px; left: -4px; border-right: none; border-top: none; }
  &.br { bottom: -4px; right: -4px; border-left: none; border-top: none; }
}
// 拖拽提示
.crop-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 5;
  pointer-events: none;
  animation: cropHintPulse 2s ease-in-out infinite;
  .crop-hint-icon { font-size: 16px; }
}
@keyframes cropHintPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
// 裁剪操作按钮
.crop-actions {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  flex-wrap: wrap;
  justify-content: center;
  &.simple { justify-content: center; }
}
.crop-warn {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #e74c3c;
  margin-bottom: 2px;
}
.crop-action-btn {
  padding: 8px 15px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &.confirm {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  }
  &.skip {
    background: #e2e8f0;
    color: #475569;
    &:hover { background: #cbd5e1; }
  }
  &.reset {
    background: transparent;
    color: #94a3b8;
    border: 1px solid #e2e8f0;
    &:hover { color: #64748b; border-color: #cbd5e1; }
  }
}
// Loading 遮罩
.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
  z-index: 10;
  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

// OCR 结果
.ocr-result-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: $radius-sm;
  padding: 14px;
  margin-bottom: 16px;
}
.ocr-result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
}
.ocr-issue {
  font-size: 11px;
  color: $text-muted;
  margin-left: auto;
}
.ocr-group-count {
  font-size: 11px;
  color: $text-muted;
  padding: 2px 8px;
  background: #e2e8f0;
  border-radius: 10px;
}
.ocr-result-balls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  &.ocr-group-row {
    padding: 6px 0;
    border-bottom: 1px dashed #e2e8f0;
    &:last-child { border-bottom: none; }
  }
}
.ocr-group-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #64748b;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  margin-right: 4px;
  flex-shrink: 0;
}
.ocr-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  &.red { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.blue { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
  &.front { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.back { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
}
.ocr-sep {
  font-size: 16px;
  font-weight: 800;
  color: #666;
  margin: 0 4px;
}
.ocr-fix-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
}
.ocr-edit-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  .edit-label {
    font-size: 12px;
    color: $text-secondary;
    white-space: nowrap;
  }
  .fix-input {
    flex: 1;
  }
}
.camera-issue-row {
  display: flex;
  align-items: center;
  gap: 12px;
  label {
    font-size: 13px;
    font-weight: 600;
    color: $text-secondary;
  }
  .issue-select { max-width: 260px; }
}

// ========== 中奖规则入口（结果区内） ==========
.rules-entry-inline {
  margin-top: 14px;
  text-align: center;
}
.rules-link-btn {
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  &:hover {
    color: #667eea;
  }
}

// ========== 中奖规则弹框内容 ==========
.rules-dialog-content {
  .rules-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rules-row {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    background: #f8fafc;
    border-radius: 6px;
    gap: 10px;
  }
  .rules-level {
    flex-shrink: 0;
    width: 56px;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
  }
  .rules-desc {
    font-size: 12px;
    color: #64748b;
  }
}

// ========== 查询按钮 ==========
.query-btn-row {
  text-align: center;
  margin-bottom: 24px;
}
.query-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 100px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ========== 查询结果 ==========
.result-section {
  animation: slideUp 0.4s ease;
}

// 中奖横幅
.prize-banner {
  text-align: center;
  padding: 24px;
  border-radius: $radius-lg;
  margin-bottom: 20px;
}
.prize-badge {
  display: inline-block;
  padding: 8px 32px;
  border-radius: 100px;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 4px;
}
.prize-congrats {
  margin: 12px 0 0;
  font-size: 15px;
  strong { font-size: 18px; }
}
.prize-sorry {
  margin: 12px 0 0;
  font-size: 14px;
  opacity: 0.7;
}

// 各等级样式
.prize-level-1 {
  background: linear-gradient(135deg, #fff0f0, #ffe0e0);
  .prize-badge {
    background: linear-gradient(135deg, #ff4d4f, #e60012);
    color: #fff;
    box-shadow: 0 0 30px rgba(230, 0, 18, 0.5);
    animation: prizeGlow 1.5s ease-in-out infinite alternate;
  }
}
.prize-level-2 {
  background: #fff8f0;
  .prize-badge { background: linear-gradient(135deg, #f0a040, #e67e22); color: #fff; }
}
.prize-level-3 {
  background: #fffbe6;
  .prize-badge { background: linear-gradient(135deg, #f5c040, #f39c12); color: #fff; }
}
.prize-level-4, .prize-level-5, .prize-level-6 {
  background: #f0f8ff;
  .prize-badge { background: linear-gradient(135deg, #5b9bd5, #2980b9); color: #fff; }
}
.prize-level-7, .prize-level-8, .prize-level-9 {
  background: #f5f6f7;
  .prize-badge { background: linear-gradient(135deg, #95a5a6, #7f8c8d); color: #fff; }
}
.prize-level-0 {
  background: #f5f5f5;
  .prize-badge { background: #ccc; color: #666; }
}

// 开奖号码卡片
.draw-result-card {
  background: $card-bg;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 14px;
  .card-date {
    font-size: 12px;
    color: $text-muted;
    font-weight: 400;
  }
}
.draw-balls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.draw-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transition: all 0.3s;
  &.red { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.blue { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
  &.front { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.back { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
  &.matched {
    animation: pulseGlow 0.8s ease-in-out infinite alternate;
    box-shadow: 0 0 16px 4px rgba(255, 215, 0, 0.8), 0 0 30px 8px rgba(255, 215, 0, 0.4);
    border: 2px solid #ffd700;
    transform: scale(1.12);
  }
}
.draw-sep {
  font-size: 20px;
  font-weight: 900;
  color: #666;
  margin: 0 4px;
}

// 对比卡片
.compare-card {
  background: $card-bg;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 18px 20px;
  .card-title {
    font-size: 14px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 14px;
    text-align: center;
  }
}
.compare-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
}
.compare-label {
  font-size: 12px;
  color: $text-muted;
  width: 48px;
  flex-shrink: 0;
  text-align: right;
}
.compare-balls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.user-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  transition: all 0.3s;
  &.red { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.blue { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
  &.front { background: radial-gradient(circle at 35% 35%, #f5a0a0, #dc3545 50%, #a71d2a 100%); }
  &.back { background: radial-gradient(circle at 35% 35%, #7eb8da, #3b82f6 50%, #1a5276 100%); }
  &.dim {
    opacity: 0.45;
    filter: grayscale(40%);
  }
  &.hit {
    animation: pulseGlow 0.8s ease-in-out infinite alternate;
    box-shadow: 0 0 16px 4px rgba(255, 215, 0, 0.8), 0 0 30px 8px rgba(255, 215, 0, 0.4);
    border: 2px solid #ffd700;
    transform: scale(1.15);
  }
}
.user-sep {
  font-size: 16px;
  font-weight: 800;
  color: #999;
  margin: 0 2px;
}
.match-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid $border;
  font-size: 13px;
  color: $text-secondary;
  strong { font-size: 16px; }
  .text-success { color: #27ae60; }
  .text-fail { color: #e74c3c; }
}
.detail-divider {
  color: #ddd;
}

// 错误信息
.error-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: $radius-sm;
  color: #dc2626;
  font-size: 13px;
  margin-top: 16px;
}

// ========== 动画 ==========
@keyframes pulseGlow {
  0% {
    box-shadow: 0 0 10px 2px rgba(255, 215, 0, 0.6), 0 0 20px 4px rgba(255, 215, 0, 0.2);
    transform: scale(1.12);
  }
  100% {
    box-shadow: 0 0 20px 6px rgba(255, 215, 0, 0.9), 0 0 40px 12px rgba(255, 215, 0, 0.4);
    transform: scale(1.18);
  }
}
@keyframes prizeGlow {
  0% { box-shadow: 0 0 20px rgba(230, 0, 18, 0.4); }
  100% { box-shadow: 0 0 40px rgba(230, 0, 18, 0.7); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .win-query-panel { padding: 16px 12px 32px; }
  .mode-tab { font-size: 13px; padding: 10px 12px; }
  .picker-ball { width: 34px; height: 34px; font-size: 11px; }
  .draw-ball { width: 38px; height: 38px; font-size: 14px; }
  .user-ball { width: 32px; height: 32px; font-size: 12px; }
  .prize-badge { font-size: 20px; padding: 6px 24px; }
  .query-btn { padding: 12px 36px; font-size: 14px; }
}
@media (max-width: 480px) {
  .picker-ball { width: 30px; height: 30px; font-size: 10px; }
  .ball-picker { gap: 4px; }
  .draw-ball { width: 34px; height: 34px; font-size: 13px; }
  .draw-balls { gap: 5px; }
  .user-ball { width: 28px; height: 28px; font-size: 11px; }
  .compare-balls { gap: 4px; }
}
</style>

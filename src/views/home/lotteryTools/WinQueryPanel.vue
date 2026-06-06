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
        <img :src="capturedImage" alt="彩票照片" class="preview-img" />
        <div class="preview-overlay" v-if="ocrLoading">
          <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
          <span>正在识别号码...</span>
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
        </div>
        <div class="ocr-result-balls">
          <template v-if="ocrResult.type === 'ssq'">
            <span v-for="r in ocrResult.numbers.reds" :key="'r'+r" class="ocr-ball red">{{ String(r).padStart(2, '0') }}</span>
            <span class="ocr-ball blue">{{ String(ocrResult.numbers.blue).padStart(2, '0') }}</span>
          </template>
          <template v-else>
            <span v-for="f in ocrResult.numbers.fronts" :key="'f'+f" class="ocr-ball front">{{ String(f).padStart(2, '0') }}</span>
            <span class="ocr-sep">+</span>
            <span v-for="b in ocrResult.numbers.backs" :key="'b'+b" class="ocr-ball back">{{ String(b).padStart(2, '0') }}</span>
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
const capturedImage = ref(null)
const ocrLoading = ref(false)
const ocrResult = ref(null)
const ocrNeedFix = ref(false)
const ocrFixSSQ = ref('')
const ocrFixDLT = ref('')
const ocrFixApplied = ref(false)

function triggerCamera() {
  cameraInput.value?.click()
}

function triggerUpload() {
  fileInput.value?.click()
}

async function onImagePicked(e) {
  const file = e.target.files?.[0]
  if (!file) return

  // 预览
  const reader = new FileReader()
  reader.onload = (ev) => {
    capturedImage.value = ev.target.result
  }
  reader.readAsDataURL(file)

  // OCR 识别
  ocrLoading.value = true
  ocrResult.value = null
  ocrNeedFix.value = false
  ocrFixApplied.value = false

  try {
    // 动态导入 tesseract.js
    const Tesseract = await import('tesseract.js')
    const { data } = await Tesseract.recognize(file, 'chi_sim+eng', {
      logger: m => console.log('OCR progress:', m),
    })

    const text = data.text
    console.log('OCR 识别文本:', text)

    // 解析识别结果
    const parsed = parseOCRText(text)
    if (parsed) {
      ocrResult.value = parsed
      // 如果识别到期号，自动匹配到下拉列表中的期号
      if (parsed.issue) {
        // 确保 issueList 已加载
        if (issueList.value.length === 0) {
          await loadIssueList()
        }
        // 多种方式匹配期号
        let matchIssue = issueList.value.find(
          i => i.issue === parsed.issue
        )
        if (!matchIssue) {
          // 模糊匹配：OCR期号可能是 "2025065" 而列表中是 "20250605001"
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
          // 期号在列表中找不到，直接使用 OCR 识别的期号，并尝试单独获取该期开奖数据
          selectedIssue.value = parsed.issue
          // 如果 ocrResult 的 type 已确定，按彩种获取该期数据
          if (parsed.type) {
            lotteryType.value = parsed.type
            try {
              const draw = await fetchDrawByIssue(parsed.issue, parsed.type)
              if (draw) {
                drawResult.value = draw
              }
            } catch (e) {
              console.warn('获取OCR期号对应开奖数据失败:', e)
            }
          }
        }
      }
      // 检查是否需要修正
      const nums = parsed.numbers
      if (parsed.type === 'ssq') {
        ocrNeedFix.value = !nums.reds || nums.reds.length < 6 || nums.blue == null
        if (nums.reds) {
          ocrFixSSQ.value = [...nums.reds].join(',') + '+' + (nums.blue || '')
        }
      } else {
        ocrNeedFix.value = !nums.fronts || nums.fronts.length < 5 || !nums.backs || nums.backs.length < 2
        if (nums.fronts && nums.backs) {
          ocrFixDLT.value = [...nums.fronts].join(',') + '+' + [...nums.backs].join(',')
        }
      }
      // 如果完整，设置已应用
      if (!ocrNeedFix.value) {
        ocrFixApplied.value = true
      }
    } else {
      ocrNeedFix.value = true
    }
  } catch (e) {
    console.error('OCR 识别失败:', e)
    errorMsg.value = 'OCR 识别失败，请重试或切换为手动输入'
  } finally {
    ocrLoading.value = false
  }

  // 重置 file input
  e.target.value = ''
}

/**
 * 解析 OCR 文本，提取号码
 */
function parseOCRText(text) {
  // 清理文本
  const clean = text.replace(/[\s\n\r]+/g, ' ').trim()
  console.log('清理后文本:', clean)

  // 提取所有数字
  const allNums = (clean.match(/\d+/g) || []).map(Number).filter(n => n > 0 && n <= 35)

  if (allNums.length < 3) return null

  // 尝试判断彩种：查找期号
  // 支持格式：第2025065期、2025065、20250605001 等
  let issue = ''
  // 优先匹配"第XXXXX期"格式
  const issueFullMatch = clean.match(/第\s*(\d{5,11})\s*期/)
  if (issueFullMatch) {
    issue = issueFullMatch[1]
  } else {
    // 匹配年份开头的期号（5-11位数字）
    const issueMatch = clean.match(/(\d{7,11})/)
    if (issueMatch) {
      issue = issueMatch[1]
    } else {
      // 匹配较短格式：年份+3位期号 如2025065
      const shortMatch = clean.match(/\b(20\d{2}\d{2,4})\b/)
      if (shortMatch) {
        issue = shortMatch[1]
      }
    }
  }

  // 尝试解析为双色球：6红球(1-33) + 1蓝球(1-16)
  const reds = allNums.filter(n => n >= 1 && n <= 33)
  const blues = allNums.filter(n => n >= 1 && n <= 16)
  const uniqueReds = [...new Set(reds)]
  const uniqueBlues = [...new Set(blues)]

  if (uniqueReds.length >= 6) {
    const redPicks = uniqueReds.slice(0, 6).sort((a, b) => a - b)
    const bluePick = uniqueBlues.find(b => !redPicks.includes(b)) || uniqueBlues[0] || 1
    return {
      type: 'ssq',
      issue,
      numbers: { reds: redPicks, blue: bluePick },
    }
  }

  // 尝试解析为大乐透：5前区(1-35) + 2后区(1-12)
  const fronts = allNums.filter(n => n >= 1 && n <= 35)
  const backs = allNums.filter(n => n >= 1 && n <= 12)
  const uniqueFronts = [...new Set(fronts)]
  const uniqueBacks = [...new Set(backs)]

  if (uniqueFronts.length >= 5) {
    const frontPicks = uniqueFronts.slice(0, 5).sort((a, b) => a - b)
    const backPicks = uniqueBacks.slice(0, 2).sort((a, b) => a - b)
    if (backPicks.length < 2) {
      // 补全后区
      while (backPicks.length < 2) {
        const next = backPicks.length > 0 ? backPicks[backPicks.length - 1] + 1 : 1
        if (next <= 12 && !backPicks.includes(next)) backPicks.push(next)
        else break
      }
    }
    return {
      type: 'dlt',
      issue,
      numbers: { fronts: frontPicks, backs: backPicks.slice(0, 2) },
    }
  }

  return null
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
.preview-img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}
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
.ocr-result-balls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
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

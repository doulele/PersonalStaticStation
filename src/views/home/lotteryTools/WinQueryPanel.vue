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
          <span>手动选择</span>
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

    <!-- ===== 手动选择区域 ===== -->
    <div v-if="inputMode === 'manual'" class="manual-section">
      <!-- 彩种切换 -->
      <div class="type-switch-row">
        <span class="type-hint">彩种</span>
        <button
          class="type-btn"
          :class="{ active: lotteryType === 'ssq' }"
          @click="switchLotteryType('ssq')"
        >
          <span class="type-dot red"></span>双色球
        </button>
        <button
          class="type-btn"
          :class="{ active: lotteryType === 'cjdlt' }"
          @click="switchLotteryType('cjdlt')"
        >
          <span class="type-dot purple"></span>大乐透
        </button>
      </div>

      <!-- 期号选择 -->
      <div class="issue-select-row">
        <label class="input-label">选择期号</label>
        <el-select
          v-model="selectedIssue"
          placeholder="请选择期号"
          filterable
          class="issue-select"
          @change="onIssueChange"
        >
          <el-option
            v-for="item in filteredIssueList"
            :key="item.issue"
            :label="`${item.issue} (${item.date})`"
            :value="item.issue"
          />
        </el-select>
        <span v-if="drawResult" class="draw-date-tag">{{ drawResult.date }}</span>
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

        <!-- 重新选择按钮 -->
        <div v-if="frontNumbers.length > 0 || backNumbers.length > 0" class="reset-select-row">
          <button class="reset-select-btn" @click="clearAllNumbers">
            <el-icon><RefreshLeft /></el-icon>
            <span>重新选择</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 拍照识别区域 ===== -->
    <div v-else class="camera-section">
      <div class="camera-top-bar">
        <span class="camera-label">拍照识别</span>
        <span class="parse-mode-pills">
          <span
            class="parse-pill"
            :class="{ active: !useAIAssist }"
            @click="useAIAssist = false"
          >基础</span>
          <span
            class="parse-pill"
            :class="{ active: useAIAssist }"
            @click="useAIAssist = true"
          >AI</span>
        </span>
      </div>
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
        <!-- OCR 准确度提示 -->
        <div class="ocr-accuracy-hint" :class="{ 'ocr-only-warn': ocrSource !== 'deepseek' }">
          <el-icon><InfoFilled /></el-icon>
          <template v-if="ocrSource === 'deepseek'">
            AI 智能解析结果 — 点击号组可手动修正
          </template>
          <template v-else>
            当前为基础 OCR 识别，可开启"AI 智能解析"获得更准确结果 — 点击号组可手动修正
          </template>
        </div>
        <!-- 多组显示 -->
        <div
          v-for="(group, gIdx) in ocrResultGroups"
          :key="'g' + gIdx"
          class="ocr-result-group-wrapper"
          :class="{ 'ocr-group-editing': editingGroupIndex === gIdx }"
        >
          <!-- 号码展示行（始终可见） -->
          <div
            class="ocr-result-balls"
            :class="{ 'ocr-group-row': ocrResultGroups.length > 1, clickable: editingGroupIndex === null, 'has-query-result': !!queryResult }"
            @click="editingGroupIndex === null ? startEditGroup(gIdx) : undefined"
          >
            <template v-if="group.type === 'ssq'">
              <span
                v-for="r in group.numbers.reds"
                :key="'r'+gIdx+'-'+r"
                class="ocr-ball red"
                :class="{ hit: isOcrBallHit(gIdx, r, 'red') }"
              >{{ String(r).padStart(2, '0') }}</span>
              <span
                class="ocr-ball blue"
                :class="{ hit: isOcrBallHit(gIdx, group.numbers.blue, 'blue') }"
              >{{ String(group.numbers.blue).padStart(2, '0') }}</span>
            </template>
            <template v-else>
              <span
                v-for="f in group.numbers.fronts"
                :key="'f'+gIdx+'-'+f"
                class="ocr-ball front"
                :class="{ hit: isOcrBallHit(gIdx, f, 'front') }"
              >{{ String(f).padStart(2, '0') }}</span>
              <span
                v-for="b in group.numbers.backs"
                :key="'b'+gIdx+'-'+b"
                class="ocr-ball back"
                :class="{ hit: isOcrBallHit(gIdx, b, 'back') }"
              >{{ String(b).padStart(2, '0') }}</span>
            </template>
          </div>

          <!-- 查询后该组的中奖标签（嵌入识别区） -->
          <div v-if="queryResult && allQueryResults[gIdx]" class="ocr-group-prize-tag" :class="'level-' + (allQueryResults[gIdx].level || 0)">
            <span class="prize-tag-label">{{ getPrizeLabel(allQueryResults[gIdx].level) }}</span>
            <span class="prize-tag-detail">
              <template v-if="group.type === 'ssq'">
                红{{ allQueryResults[gIdx].matchedReds?.length || 0 }} 蓝{{ allQueryResults[gIdx].matchedBlue ? '中' : '未中' }}
              </template>
              <template v-else>
                前{{ allQueryResults[gIdx].matchedFronts?.length || 0 }} 后{{ allQueryResults[gIdx].matchedBacks?.length || 0 }}
              </template>
            </span>
          </div>

          <!-- 编辑面板（展开在行下方） -->
          <div v-if="editingGroupIndex === gIdx" class="ocr-edit-panel">
            <!-- 红球/前区 -->
            <div class="edit-section">
              <div class="edit-section-title">
                <span class="edit-dot front-dot"></span>
                {{ group.type === 'ssq' ? '红球' : '前区' }}
                <span class="edit-count">（选 {{ editingSnapshot?.[group.type === 'ssq' ? 'reds' : 'fronts']?.size || 0 }}/{{ group.type === 'ssq' ? 6 : 5 }} 个）</span>
              </div>
              <div class="edit-grid edit-grid-front">
                <button
                  v-for="n in getEditNumberList(group)"
                  :key="'ef'+gIdx+'-'+n"
                  class="edit-cell"
                  :class="[
                    getEditBallColor(group, n),
                    { on: isEditNumberSelected(group, n) }
                  ]"
                  :disabled="!canToggleEditNumber(group, n) && !isEditNumberSelected(group, n)"
                  @click="toggleEditNumber(group, n)"
                >{{ String(n).padStart(2, '0') }}</button>
              </div>
            </div>

            <!-- 蓝球/后区 -->
            <div class="edit-section">
              <div class="edit-section-title">
                <span class="edit-dot back-dot"></span>
                {{ group.type === 'ssq' ? '蓝球' : '后区' }}
                <span class="edit-count">（选 {{ group.type === 'ssq' ? (editingSnapshot?.blue != null ? 1 : 0) : (editingSnapshot?.backs?.size || 0) }}/{{ group.type === 'ssq' ? 1 : 2 }} 个）</span>
              </div>
              <div class="edit-grid edit-grid-back">
                <button
                  v-for="n in getEditBackList(group)"
                  :key="'eb'+gIdx+'-'+n"
                  class="edit-cell"
                  :class="[
                    getEditBallColor(group, n, true),
                    { on: isEditNumberSelected(group, n, true) }
                  ]"
                  :disabled="!canToggleEditNumber(group, n, true) && !isEditNumberSelected(group, n, true)"
                  @click="toggleEditNumber(group, n, true)"
                >{{ String(n).padStart(2, '0') }}</button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="edit-actions">
              <button class="edit-action-btn confirm" @click="confirmEditGroup(gIdx)">
                <el-icon><Check /></el-icon> 确认修改
              </button>
              <button class="edit-action-btn cancel" @click="cancelEditGroup()">
                <el-icon><Close /></el-icon> 取消
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 拍照模式期号 -->
      <div v-if="ocrResult" class="camera-issue-row">
        <label>查询期号</label>
        <el-select v-model="selectedIssue" placeholder="选择期号" filterable class="issue-select">
          <el-option
            v-for="item in cameraIssueOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
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
        <p v-if="bestQueryResult.level > 0" class="prize-congrats">
          🎉 恭喜中奖！您中了 <strong>{{ prizeStyle.label }}</strong>
        </p>
        <p v-else class="prize-sorry">很遗憾，本次未中奖。继续加油！</p>
      </div>

      <!-- 开奖号码 + 内嵌中奖详情 -->
      <div class="draw-result-card">
        <div class="card-title">
          <span>第 {{ displayIssue }} 期 开奖号码</span>
          <span class="card-date">{{ drawResult.date }}</span>
        </div>
        <div class="draw-balls">
          <template v-if="lotteryType === 'ssq'">
            <span
              v-for="r in drawResult.reds"
              :key="'dr'+r"
              class="draw-ball red"
              :class="{ matched: allMatchedReds.includes(r) }"
            >{{ String(r).padStart(2, '0') }}</span>
            <span
              class="draw-ball blue"
              :class="{ matched: allMatchedBlue }"
            >{{ String(drawResult.blue).padStart(2, '0') }}</span>
          </template>
          <template v-else>
            <span
              v-for="f in drawResult.fronts"
              :key="'df'+f"
              class="draw-ball front"
              :class="{ matched: allMatchedFronts.includes(f) }"
            >{{ String(f).padStart(2, '0') }}</span>
            <span class="draw-sep">+</span>
            <span
              v-for="b in drawResult.backs"
              :key="'db'+b"
              class="draw-ball back"
              :class="{ matched: allMatchedBacks.includes(b) }"
            >{{ String(b).padStart(2, '0') }}</span>
          </template>
        </div>

        <!-- 中奖详情（拍照模式：多注对比） -->
        <div v-if="inputMode !== 'manual'" class="draw-prize-detail">
          <div
            v-for="(gr, grIdx) in allQueryResults"
            :key="'prize'+grIdx"
            class="prize-detail-row"
          >
            <span class="prize-detail-label">第{{ grIdx + 1 }}注</span>
            <!-- 该注号码展示 -->
            <div class="prize-detail-balls">
              <template v-if="lotteryType === 'ssq' && gr.numbers">
                <span
                  v-for="r in gr.numbers.reds"
                  :key="'pr'+grIdx+'-'+r"
                  class="mini-ball red"
                  :class="{ hit: gr.matchedReds?.includes(r) }"
                >{{ String(r).padStart(2, '0') }}</span>
                <span
                  v-if="gr.numbers.blue != null"
                  class="mini-ball blue"
                  :class="{ hit: gr.matchedBlue }"
                >{{ String(gr.numbers.blue).padStart(2, '0') }}</span>
              </template>
              <template v-else-if="gr.numbers">
                <span
                  v-for="f in gr.numbers.fronts"
                  :key="'pf'+grIdx+'-'+f"
                  class="mini-ball front"
                  :class="{ hit: gr.matchedFronts?.includes(f) }"
                >{{ String(f).padStart(2, '0') }}</span>
                <span class="ball-sep">+</span>
                <span
                  v-for="b in gr.numbers.backs"
                  :key="'pb'+grIdx+'-'+b"
                  class="mini-ball back"
                  :class="{ hit: gr.matchedBacks?.includes(b) }"
                >{{ String(b).padStart(2, '0') }}</span>
              </template>
            </div>
            <span class="prize-detail-info">
              <span class="prize-detail-badge" :class="'level-' + (gr.level || 0)">{{ getPrizeLabel(gr.level) }}</span>
              <span class="prize-detail-match">
                <template v-if="lotteryType === 'ssq'">
                  <span class="match-count">{{ gr.matchedReds?.length || 0 }}+{{ gr.matchedBlue ? 1 : 0 }}</span>
                </template>
                <template v-else>
                  <span class="match-count">{{ gr.matchedFronts?.length || 0 }}+{{ gr.matchedBacks?.length || 0 }}</span>
                </template>
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 手动模式：您的号码（拍照模式已在上方识别区展示） -->
      <div v-if="inputMode === 'manual'" class="your-numbers-card">
        <div class="card-title">您的号码</div>
        <div class="your-balls">
          <template v-if="lotteryType === 'ssq'">
            <span
              v-for="r in frontNumbers"
              :key="'ynr'+r"
              class="your-ball red"
              :class="{ hit: allQueryResults[0]?.matchedReds?.includes(r) }"
            >{{ String(r).padStart(2, '0') }}</span>
            <span
              v-if="backNumbers[0]"
              class="your-ball blue"
              :class="{ hit: allQueryResults[0]?.matchedBlue }"
            >{{ String(backNumbers[0]).padStart(2, '0') }}</span>
          </template>
          <template v-else>
            <span
              v-for="f in frontNumbers"
              :key="'ynf'+f"
              class="your-ball front"
              :class="{ hit: allQueryResults[0]?.matchedFronts?.includes(f) }"
            >{{ String(f).padStart(2, '0') }}</span>
            <span class="your-sep">+</span>
            <span
              v-for="b in backNumbers"
              :key="'ynb'+b"
              class="your-ball back"
              :class="{ hit: allQueryResults[0]?.matchedBacks?.includes(b) }"
            >{{ String(b).padStart(2, '0') }}</span>
          </template>
        </div>
        <!-- 中奖结果（融合在您的号码卡片内） -->
        <div v-if="result" class="your-result">
          <span class="prize-detail-badge" :class="'level-' + (result.level || 0)">{{ getPrizeLabel(result.level) }}</span>
          <span class="match-count">
            <template v-if="lotteryType === 'ssq'">{{ result.matchedReds?.length || 0 }}+{{ result.matchedBlue ? 1 : 0 }}</template>
            <template v-else>{{ result.matchedFronts?.length || 0 }}+{{ result.matchedBacks?.length || 0 }}</template>
          </span>
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
import { Edit, Camera, FolderOpened, Loading, Search, WarningFilled, InfoFilled, Check, Close, RefreshLeft } from '@element-plus/icons-vue'
import { fetchLatestDraw, fetchHistoryDraws, fetchDrawByIssue } from '@/api/lottery'
import { checkSSQ, checkDLT, getPrizeStyle } from '@/utils/lottery/prizeRules'

// ===== 输入模式 =====
const inputMode = ref('manual') // 'manual' | 'camera'
const lotteryType = ref('ssq') // 'ssq' | 'cjdlt'
const isDLT = computed(() => lotteryType.value === 'cjdlt')

// 仅提取期号数字部分用于展示
const displayIssue = computed(() => selectedIssue.value || '')

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

// ===== 手动选择 =====
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

function clearAllNumbers() {
  frontNumbers.value = []
  backNumbers.value = []
  resetResults()
}

function resetResults() {
  queryResult.value = null
  allQueryResults.value = []
  drawResult.value = null
  errorMsg.value = ''
}

function switchLotteryType(type) {
  if (lotteryType.value === type) return
  lotteryType.value = type
  frontNumbers.value = []
  backNumbers.value = []
  resetResults()
  // 该彩种数据未加载则按需加载
  const hasData = allIssueList.value.some(i => i.type === type)
  if (!hasData) {
    loadIssueList(type).then(() => selectLatestIssue(type))
  } else {
    selectLatestIssue(type)
  }
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
const allIssueList = ref([])          // 所有彩种混合期号列表
const selectedIssue = ref('')         // 纯期号字符串，如 "2024100"
const drawResult = ref(null)

// 按当前彩种过滤期号
const filteredIssueList = computed(() => {
  return allIssueList.value.filter(i => i.type === lotteryType.value)
})

onMounted(async () => {
  // 进入页面只加载默认双色球的期号，大乐透按需懒加载
  try {
    await loadIssueList('ssq')
  } catch (e) {
    console.error('加载期号列表失败:', e)
  }
  // 默认选 SSQ 最新一期
  selectLatestIssue('ssq')
})

/** 选中指定彩种的最新一期 */
function selectLatestIssue(type) {
  const list = allIssueList.value.filter(i => i.type === type)
  if (list.length > 0) {
    const latest = list[0]  // 已按期号降序排列
    selectedIssue.value = latest.issue
    drawResult.value = latest
  }
}

async function loadIssueList(type) {
  try {
    const list = await fetchHistoryDraws(type, 50)
    const labeled = list.map(i => ({ ...i, type }))
    // 合并到 allIssueList：先移除该彩种的旧数据，再合并新数据并排序
    const other = allIssueList.value.filter(i => i.type !== type)
    allIssueList.value = [...other, ...labeled].sort((a, b) => b.issue.localeCompare(a.issue))
  } catch (e) {
    console.error(`loadIssueList(${type}) 异常:`, e)
  }
}

function detectDrawType(draw) {
  if (draw.type === 'ssq' || draw.reds) return 'ssq'
  if (draw.type === 'cjdlt' || draw.fronts) return 'cjdlt'
  return null
}

async function onIssueChange(issue) {
  if (!issue) {
    drawResult.value = null
    return
  }
  const item = allIssueList.value.find(
    i => i.issue === issue && i.type === lotteryType.value
  )
  if (item) {
    drawResult.value = item
  } else {
    // 列表中找不到，尝试从 API 获取
    try {
      drawResult.value = await fetchDrawByIssue(issue, lotteryType.value)
    } catch (e) {
      console.warn('获取期号开奖数据失败:', e)
      drawResult.value = null
    }
  }
}

// ===== 查询逻辑 =====
const queryLoading = ref(false)
const queryResult = ref(null)
const allQueryResults = ref([])  // 多组号码逐注结果
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

// 取所有组中最优结果（等级最小 !=0 > 等级0 > 都未中奖取第一组）
const bestQueryResult = computed(() => {
  if (allQueryResults.value.length === 0) return { level: 0, name: '未中奖', matchedReds: [], matchedBlue: false, matchedFronts: [], matchedBacks: [] }
  const won = allQueryResults.value.filter(r => r.level > 0)
  if (won.length > 0) return won.reduce((a, b) => a.level < b.level ? a : b)
  return allQueryResults.value[0]
})

// 聚合所有组的命中号码（用于开奖号码高亮）
const allMatchedReds = computed(() => {
  const set = new Set()
  allQueryResults.value.forEach(r => (r.matchedReds || []).forEach(n => set.add(n)))
  return [...set]
})
const allMatchedBlue = computed(() => {
  return allQueryResults.value.some(r => r.matchedBlue)
})
const allMatchedFronts = computed(() => {
  const set = new Set()
  allQueryResults.value.forEach(r => (r.matchedFronts || []).forEach(n => set.add(n)))
  return [...set]
})
const allMatchedBacks = computed(() => {
  const set = new Set()
  allQueryResults.value.forEach(r => (r.matchedBacks || []).forEach(n => set.add(n)))
  return [...set]
})

// 手动模式：单组结果（用于"您的号码"卡片内联提示）
const result = computed(() => {
  return allQueryResults.value[0] || null
})

const prizeStyle = computed(() => {
  return getPrizeStyle(bestQueryResult.value.level)
})

function getPrizeLabel(level) {
  return getPrizeStyle(level).label
}

/** 判断 OCR 识别区的某个球是否命中（用于高亮） */
function isOcrBallHit(gIdx, number, position) {
  if (!queryResult.value || !allQueryResults.value[gIdx]) return false
  const gr = allQueryResults.value[gIdx]
  if (position === 'red') return gr.matchedReds?.includes(number)
  if (position === 'blue') return gr.matchedBlue
  if (position === 'front') return gr.matchedFronts?.includes(number)
  if (position === 'back') return gr.matchedBacks?.includes(number)
  return false
}

async function doQuery() {
  queryLoading.value = true
  errorMsg.value = ''
  queryResult.value = null
  allQueryResults.value = []

  try {
    // 拍照模式：以 OCR 识别结果为准
    const isCamera = inputMode.value === 'camera'
    if (isCamera && ocrResult.value) {
      lotteryType.value = ocrResult.value.type
    }

    // 获取开奖数据 — 优先通过 API 获取确保数据最新，fallback 到缓存
    const selIssue = selectedIssue.value
    let draw
    if (selIssue) {
      // 优先尝试从 API 获取该期号的实时开奖数据
      try {
        draw = await fetchDrawByIssue(selIssue, lotteryType.value)
      } catch (apiErr) {
        console.warn('API 获取开奖数据失败，尝试使用缓存:', apiErr)
      }

      // API 失败或无数据时，fallback 到缓存列表
      if (!draw) {
        const item = allIssueList.value.find(
          i => i.issue === selIssue && i.type === lotteryType.value
        )
        if (item) {
          draw = item
        } else {
          // 只匹配期号（跨彩种 fallback）
          const fallback = allIssueList.value.find(i => i.issue === selIssue)
          if (fallback) {
            draw = fallback
            lotteryType.value = fallback.type
          }
        }
      }
    } else {
      // 未选择期号 → 获取最新开奖
      draw = await fetchLatestDraw(lotteryType.value)
    }

    if (!draw) {
      // 判断是未来期号（尚未开奖）还是接口异常
      if (selIssue) {
        const latestDrawnIssue = allIssueList.value
          .filter(i => i.type === lotteryType.value)
          .map(i => i.issue)
          .sort()
          .pop()  // 同彩种最大期号
        if (latestDrawnIssue && selIssue > latestDrawnIssue) {
          errorMsg.value = `第 ${selIssue} 期尚未开奖，请选择已开奖的期号`
          queryLoading.value = false
          return
        }
      }
      errorMsg.value = '获取开奖数据失败，请稍后重试'
      queryLoading.value = false
      return
    }

    // 如果 draw 的彩种和当前不一致，尝试修正
    const drawType = detectDrawType(draw)
    if (drawType !== lotteryType.value && selIssue) {
      const correct = allIssueList.value.find(
        i => i.issue === selIssue && i.type === lotteryType.value
      )
      if (correct) {
        draw = correct
      }
    }

    drawResult.value = draw
    selectedIssue.value = draw.issue
    if (draw.type) lotteryType.value = draw.type

    // 获取所有用户号码组
    let numberGroups = []
    if (isCamera) {
      // 拍照模式：使用 ocrResultGroups 中的所有组
      numberGroups = ocrResultGroups.value.map(g => g.numbers)
      if (numberGroups.length === 0) {
        numberGroups = [ocrResult.value.numbers]
      }
    } else {
      // 手动模式：单注
      if (lotteryType.value === 'ssq') {
        numberGroups = [{ reds: [...frontNumbers.value], blue: backNumbers.value[0] }]
      } else {
        numberGroups = [{ fronts: [...frontNumbers.value], backs: [...backNumbers.value] }]
      }
    }

    // 逐组判定中奖
    const results = []
    for (const nums of numberGroups) {
      if (lotteryType.value === 'ssq') {
        results.push(checkSSQ(nums.reds, draw.reds, nums.blue, draw.blue))
      } else {
        results.push(checkDLT(nums.fronts, nums.backs, draw.fronts, draw.backs))
      }
    }

    // 注入原始号码，方便展示
    allQueryResults.value = results.map((r, i) => ({
      ...r,
      numbers: numberGroups[i],
    }))

    // 兼容旧字段（第一组）
    queryResult.value = allQueryResults.value[0] || null
  } catch (e) {
    errorMsg.value = '查询失败：' + e.message
  } finally {
    queryLoading.value = false
  }
}

// 拍照模式下，将 OCR 识别的期号也加入下拉选项
const cameraIssueOptions = computed(() => {
  const options = allIssueList.value
    .filter(i => i.type === lotteryType.value)
    .map(i => ({
      value: i.issue,
      label: `${i.issue} (${i.date})`,
    }))
  // 如果 OCR 识别到期号且不在列表中，追加
  if (ocrResult.value?.issue) {
    const exists = options.some(o => o.value === ocrResult.value.issue)
    if (!exists) {
      options.unshift({
        value: ocrResult.value.issue,
        label: `${ocrResult.value.issue} (OCR识别)`,
      })
    }
  }
  return options
})

// ===== 输入模式切换时重置 =====
watch(inputMode, () => {
  // 重置所有查询结果相关状态
  queryResult.value = null
  allQueryResults.value = []
  drawResult.value = null
  errorMsg.value = ''

  if (inputMode.value === 'manual') {
    // 切换到手动：清除拍照识别所有数据
    capturedImage.value = null
    originalFile.value = null
    ocrResult.value = null
    ocrResultGroups.value = []
    ocrNeedFix.value = false
    ocrFixApplied.value = false
    ocrSource.value = ''
    cropRect.value = null
    imageVisInfo.value = null
    editingGroupIndex.value = null
    editingSnapshot.value = null
    ocrLoading.value = false
    // 手动模式默认 ssq
    lotteryType.value = 'ssq'
    frontNumbers.value = []
    backNumbers.value = []
    selectLatestIssue('ssq')
  } else {
    // 切换到拍照：清除手动选择数据
    frontNumbers.value = []
    backNumbers.value = []
    selectedIssue.value = ''
  }
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
const ocrFixApplied = ref(false)
const ocrSource = ref('')  // 'deepseek' | 'ocr_only' | ''
const useAIAssist = ref(false)  // 是否启用 AI 辅助解析

// 逐组编辑状态
const editingGroupIndex = ref(null)       // null = 没有在编辑, 0/1/2... = 正在编辑第几组
const editingSnapshot = ref(null)         // { reds/fronts: Set<number>, blue: number|null / backs: Set<number> }

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
  ocrSource.value = ''
  cropRect.value = null
  imageVisInfo.value = null

  // 预览
  const reader = new FileReader()
  reader.onload = (ev) => { capturedImage.value = ev.target.result }
  reader.readAsDataURL(file)

  // 重置 file input
  e.target.value = ''
}

/**
 * 裁剪图片为 base64，并做 OCR 预处理（灰度化+对比度+锐化+二值化）
 * @param {string|File} src
 * @param {{x:number,y:number,w:number,h:number}} rect
 * @returns {Promise<string>} base64 data URL
 */
function cropImageToBase64(src, rect) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = async () => {
      try {
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        const sx = Math.round(rect.x * iw)
        const sy = Math.round(rect.y * ih)
        const sw = Math.round(rect.w * iw)
        const sh = Math.round(rect.h * ih)

        // 限制最大尺寸，同时确保文字不会太小
        const maxW = 2000
        const minW = 800
        let scale = Math.min(1, maxW / sw)
        if (sw * scale < minW && sw > minW) scale = minW / sw
        const cw = Math.round(sw * scale)
        const ch = Math.round(sh * scale)

        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)

        const result = canvas.toDataURL('image/jpeg', 0.92)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = typeof src === 'string' ? src : URL.createObjectURL(src)
  })
}

/** 裁剪 + 调用腾讯云 OCR */
async function runCropOCR() {
  if (!cropRect.value || cropTooSmall.value || !capturedImage.value) return
  await doOCRWithImage(capturedImage.value, cropRect.value)
}

/** 整图 OCR */
async function runFullOCR() {
  if (!originalFile.value) return
  await doOCRWithImage(originalFile.value, { x: 0, y: 0, w: 1, h: 1 })
}

/** 核心 OCR 流程：裁剪 → 后端 OCR + LLM 智能解析 → 结构化结果 */
async function doOCRWithImage(src, rect) {
  ocrLoading.value = true

  try {
    // 1) 裁剪图片
    let base64
    try {
      base64 = await cropImageToBase64(src, rect)
    } catch (cropErr) {
      console.warn('图片裁剪失败，尝试原始图片:', cropErr)
      if (originalFile.value) {
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(originalFile.value)
        })
      } else {
        base64 = capturedImage.value
      }
    }

    // 2) 调用后端 OCR + LLM 智能解析（一体接口）
    errorMsg.value = ''
    const res = await fetch('/staticTool/api/ocr/parse-lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, useAI: useAIAssist.value })
    })
    const json = await res.json()

    if (json.code !== 0 || !json.data) {
      errorMsg.value = json.message || 'OCR 识别失败'
      ocrNeedFix.value = true
      return
    }

    const parsed = json.data
    ocrSource.value = parsed.source || ''
    console.log('[OCR] 后端解析结果 (source=' + ocrSource.value + '):', JSON.stringify({
      groups: parsed.groups?.length || 0
    }))

    // 3) 更新 UI
    const groups = parsed.groups || []
    if (groups.length > 0) {
      ocrResultGroups.value = groups
      ocrResult.value = groups[0]

      const firstGroup = groups[0]
      if (firstGroup.issue) {
        if (allIssueList.value.length === 0) await loadIssueList(firstGroup.type || 'ssq')
        let matchIssue = allIssueList.value.find(
          i => i.issue === firstGroup.issue && i.type === firstGroup.type
        )
        if (!matchIssue) {
          // 宽泛匹配：只看期号
          matchIssue = allIssueList.value.find(i => i.issue === firstGroup.issue)
        }
        if (!matchIssue) {
          matchIssue = allIssueList.value.find(
            i => i.issue.includes(firstGroup.issue) || firstGroup.issue.includes(i.issue)
          )
        }
        if (matchIssue) {
          selectedIssue.value = matchIssue.issue
          lotteryType.value = matchIssue.type
        } else {
          // 期号不在列表中，仍设置以便用户直接点查询（doQuery 会自行获取开奖数据）
          selectedIssue.value = firstGroup.issue
          lotteryType.value = firstGroup.type
        }
      } else {
        lotteryType.value = firstGroup.type
      }

      // 检查所有组是否都完整
      ocrNeedFix.value = groups.some(g => {
        const nums = g.numbers
        if (g.type === 'ssq') return !nums.reds || nums.reds.length < 6 || nums.blue == null
        return !nums.fronts || nums.fronts.length < 5 || !nums.backs || nums.backs.length < 2
      })
      if (!ocrNeedFix.value) ocrFixApplied.value = true
    } else {
      const hint = ocrSource.value === 'ocr_only'
        ? '基础 OCR 也未提取到号码，请切换为手动选择'
        : '未能解析出彩票号码，请查看服务器日志排查，或切换为手动选择'
      errorMsg.value = hint
      ocrNeedFix.value = true
    }
  } catch (e) {
    console.error('OCR 识别失败:', e)
    errorMsg.value = 'OCR 识别失败，请重试或切换为手动选择'
  } finally {
    ocrLoading.value = false
  }
}

// ===== 逐组编辑方法 =====

/** 判断是 SSQ 还是 DLT */
function getEditGroupType(group) {
  return group.type === 'ssq' ? 'ssq' : 'cjdlt'
}

/** SSQ 红球范围 1-33，DLT 前区 1-35 */
function getEditNumberList(group) {
  const type = getEditGroupType(group)
  const max = type === 'ssq' ? 33 : 35
  return Array.from({ length: max }, (_, i) => i + 1)
}

/** SSQ 蓝球范围 1-16，DLT 后区 1-12 */
function getEditBackList(group) {
  const type = getEditGroupType(group)
  const max = type === 'ssq' ? 16 : 12
  return Array.from({ length: max }, (_, i) => i + 1)
}

/** 编辑球的颜色 class */
function getEditBallColor(group, n, isBack = false) {
  const type = getEditGroupType(group)
  if (type === 'ssq') return isBack ? 'blue' : 'red'
  return isBack ? 'back' : 'front'
}

/** 某个数字在编辑快照中是否已选中 */
function isEditNumberSelected(group, n, isBack = false) {
  if (!editingSnapshot.value) return false
  const type = getEditGroupType(group)
  if (type === 'ssq') {
    if (isBack) return editingSnapshot.value.blue === n
    return editingSnapshot.value.reds?.has(n) || false
  } else {
    if (isBack) return editingSnapshot.value.backs?.has(n) || false
    return editingSnapshot.value.fronts?.has(n) || false
  }
}

/** 是否还能继续选（达到上限后不可再选未选中的） */
function canToggleEditNumber(group, n, isBack = false) {
  if (!editingSnapshot.value) return false
  const type = getEditGroupType(group)
  if (type === 'ssq') {
    if (isBack) return true // SSQ 蓝球只有一个，点了就替换
    if (editingSnapshot.value.reds?.has(n)) return true // 已选可取消
    return (editingSnapshot.value.reds?.size || 0) < 6
  } else {
    if (isBack) {
      if (editingSnapshot.value.backs?.has(n)) return true
      return (editingSnapshot.value.backs?.size || 0) < 2
    }
    if (editingSnapshot.value.fronts?.has(n)) return true
    return (editingSnapshot.value.fronts?.size || 0) < 5
  }
}

/** 点击编辑球切换选中/取消 */
function toggleEditNumber(group, n, isBack = false) {
  if (!editingSnapshot.value) return
  const type = getEditGroupType(group)

  if (type === 'ssq') {
    if (isBack) {
      // SSQ 蓝球：直接替换
      editingSnapshot.value.blue = editingSnapshot.value.blue === n ? null : n
    } else {
      const reds = editingSnapshot.value.reds
      if (reds.has(n)) {
        reds.delete(n)
      } else if (reds.size < 6) {
        reds.add(n)
      }
    }
  } else {
    // DLT
    if (isBack) {
      const backs = editingSnapshot.value.backs
      if (backs.has(n)) {
        backs.delete(n)
      } else if (backs.size < 2) {
        backs.add(n)
      }
    } else {
      const fronts = editingSnapshot.value.fronts
      if (fronts.has(n)) {
        fronts.delete(n)
      } else if (fronts.size < 5) {
        fronts.add(n)
      }
    }
  }
  // 触发响应式更新
  editingSnapshot.value = { ...editingSnapshot.value }
}

/** 进入编辑模式 */
function startEditGroup(gIdx) {
  const group = ocrResultGroups.value[gIdx]
  if (!group) return
  const type = getEditGroupType(group)
  const nums = group.numbers

  if (type === 'ssq') {
    editingSnapshot.value = {
      reds: new Set(nums.reds || []),
      blue: nums.blue || null,
    }
  } else {
    editingSnapshot.value = {
      fronts: new Set(nums.fronts || []),
      backs: new Set(nums.backs || []),
    }
  }
  editingGroupIndex.value = gIdx
  errorMsg.value = ''
}

/** 确认编辑：将快照写回 ocrResultGroups，并更新 ocrResult */
function confirmEditGroup(gIdx) {
  if (!editingSnapshot.value) return
  const group = ocrResultGroups.value[gIdx]
  if (!group) return
  const type = getEditGroupType(group)
  const snap = editingSnapshot.value

  let numbers
  if (type === 'ssq') {
    const reds = [...(snap.reds || [])].sort((a, b) => a - b)
    numbers = { reds, blue: snap.blue }
    // 检查完整性
    if (reds.length < 6 || snap.blue == null) {
      errorMsg.value = `第${gIdx + 1}组识别不完整：需要 6 个红球和 1 个蓝球`
      return
    }
  } else {
    const fronts = [...(snap.fronts || [])].sort((a, b) => a - b)
    const backs = [...(snap.backs || [])].sort((a, b) => a - b)
    numbers = { fronts, backs }
    if (fronts.length < 5 || backs.length < 2) {
      errorMsg.value = `第${gIdx + 1}组识别不完整：需要 5 个前区和 2 个后区`
      return
    }
  }

  // 写回
  ocrResultGroups.value[gIdx] = { ...group, numbers }

  // 如果编辑的是第一组，同步到 ocrResult
  if (gIdx === 0) {
    ocrResult.value = { ...ocrResult.value, numbers }
  }

  // 用户手动修复过，清除 needFix 标记
  ocrNeedFix.value = false
  ocrFixApplied.value = true
  errorMsg.value = ''

  // 退出编辑
  cancelEditGroup()
}

/** 取消编辑 */
function cancelEditGroup() {
  editingGroupIndex.value = null
  editingSnapshot.value = null
}
</script>

<style lang="scss" scoped src="./WinQueryPanel.scss"></style>

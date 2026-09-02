<template>
  <div class="stock-detail-page fade-in">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
    </div>

    <!-- 头部概要 -->
    <div class="detail-hero" v-if="result">
      <div class="hero-top">
        <div class="hero-left">
          <h2>{{ result.name }} <span class="code-text">{{ result.code }}</span> <span :class="['stage-tag', 'stage-tag-inline', stageTagClass]">{{ result.stageName }}</span></h2>
          <div class="price-line">
            <span :class="['current-price', result.changePct > 0 ? 'price-up' : result.changePct < 0 ? 'price-down' : 'price-zero']">¥{{ result.price?.toFixed(2) }}</span>
            <span :class="result.changePct >= 0 ? 'text-up' : 'text-down'" class="change-badge">
              {{ result.changePct >= 0 ? '+' : '' }}{{ result.changePct?.toFixed(2) }}%
            </span>
            <el-tag size="small" :type="result.marketStatusType" effect="plain">{{ result.marketStatusLabel }}</el-tag>
          </div>
        </div>
        <div class="hero-right">
          <div class="score-card">
            <div class="score-num">{{ result.score }}</div>
            <div class="score-label">妖股评分</div>
            <div class="score-bar-bg">
              <div class="score-bar-fill" :style="{ width: result.score + '%' }"></div>
            </div>
          </div>
          <div class="rec-badge" :style="{ color: result.recommendColor, borderColor: result.recommendColor }">
            {{ result.recommendEmoji }} {{ result.recommendLevel }}
          </div>
        </div>
      </div>
      <!-- 持仓信息条（有持仓时占满一行） -->
      <div v-if="positionData?.hasPosition" class="hero-position-bar">
        <div class="hero-pos-item">
          <span class="hero-pos-label">持仓成本</span>
          <span class="hero-pos-value">¥{{ positionData.avgCost.toFixed(3) }}</span>
        </div>
        <div class="hero-pos-item">
          <span class="hero-pos-label">持仓股数</span>
          <span class="hero-pos-value">{{ positionData.totalShares }}股</span>
        </div>
        <div class="hero-pos-item">
          <span class="hero-pos-label">持仓盈亏</span>
          <span class="hero-pos-value" :class="positionData.floatPnl >= 0 ? 'text-up' : 'text-down'">
            {{ positionData.floatPnl >= 0 ? '+' : '-' }}¥{{ formatHeroMoney(Math.abs(positionData.floatPnl)) }}
          </span>
        </div>
        <div class="hero-pos-item">
          <span class="hero-pos-label">盈亏比例</span>
          <span class="hero-pos-value" :class="positionData.floatPnl >= 0 ? 'text-up' : 'text-down'">
            {{ positionData.floatPnl >= 0 ? '+' : '-' }}{{ Math.abs(positionData.floatPnlPct) }}%
          </span>
        </div>
      </div>
      <!-- 快速概览条 -->
      <div class="hero-quick-stats">
        <div class="quick-stat">
          <span class="qs-label">今开</span>
          <span class="qs-value">{{ result.open?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">最高</span>
          <span class="qs-value text-up">{{ result.high?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">最低</span>
          <span class="qs-value text-down">{{ result.low?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">昨收</span>
          <span class="qs-value">{{ result.yesterdayClose?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">振幅</span>
          <span class="qs-value text-warn">{{ result.amplitude?.toFixed(1) }}%</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">成交额</span>
          <span class="qs-value">{{ result.amountYi?.toFixed(2) }}亿</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">成交量</span>
          <span class="qs-value">{{ result.volumeWan?.toFixed(1) }}万手</span>
        </div>
      </div>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading && !result" class="loading-skeleton">
      <div class="skeleton-hero"></div>
      <div class="skeleton-metrics">
        <div class="skeleton-card" v-for="i in 6" :key="i"></div>
      </div>
    </div>
    <div v-else-if="errorMsg" class="error-block">
      <el-empty description="获取数据失败" :image-size="80">
        <template #description>
          <p class="error-desc">数据获取过程中出现问题</p>
        </template>
        <el-alert type="error" :title="errorMsg" :closable="false" show-icon />
        <el-button type="primary" style="margin-top: 16px" @click="loadDetail">重新加载</el-button>
      </el-empty>
    </div>
    <div v-else-if="!loading && !result && !errorMsg" class="empty-state">
      <el-empty description="未提供股票代码" :image-size="80">
        <template #description>
          <p class="error-desc">请从股票筛选列表中选择一只股票查看详情</p>
        </template>
        <el-button type="primary" @click="$router.back()">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 评估报告主体 -->
    <div v-if="result" class="report-body">
      <!-- 我的交易记录 & 持仓管理（置顶） -->
      <PositionManager
        :stock-code="result.code"
        :stock-name="result.name"
        :current-price="result.price"
        @position-change="onPositionChange"
        class="section-order-0"
      />

      <!-- 第一行：关键指标卡片（6个核心指标） -->
      <div class="metrics-row section-order-2">
        <div class="metric-card">
          <div class="metric-icon mi-amber"><el-icon :size="20"><Odometer /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.turnover?.toFixed(1) }}%</div>
            <div class="metric-label">换手率</div>
          </div>
          <div class="metric-desc">{{ result.turnDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon mi-blue"><el-icon :size="20"><DataLine /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.volumeRatio?.toFixed(2) }}</div>
            <div class="metric-label">量比</div>
          </div>
          <div class="metric-desc">{{ result.volDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon mi-pink"><el-icon :size="20"><TrendCharts /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value" :class="result.gain5d >= 0 ? 'text-up' : 'text-down'">
              {{ result.gain5d >= 0 ? '+' : '' }}{{ result.gain5d?.toFixed(1) }}%
            </div>
            <div class="metric-label">5日涨幅</div>
          </div>
          <div class="metric-desc">{{ result.gainDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon mi-green"><el-icon :size="20"><Histogram /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.marketCap?.toFixed(1) }}亿</div>
            <div class="metric-label">流通市值</div>
          </div>
          <div class="metric-desc">{{ result.capDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon mi-purple"><el-icon :size="20"><Histogram /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value text-warn">{{ result.amplitude?.toFixed(1) }}%</div>
            <div class="metric-label">今日振幅</div>
          </div>
          <div class="metric-desc">{{ result.ampDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon mi-orange"><el-icon :size="20"><TrendCharts /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value" :class="result.gain10d >= 0 ? 'text-up' : 'text-down'">
              {{ result.gain10d >= 0 ? '+' : '' }}{{ result.gain10d?.toFixed(1) }}%
            </div>
            <div class="metric-label">10日涨幅</div>
          </div>
          <div class="metric-desc">{{ result.gain10dDesc }}</div>
        </div>
      </div>

      <!-- 第二行：评分雷达 + 阶段详情 -->
      <div class="detail-grid section-order-1">
        <!-- 因子评分详情 -->
        <el-card class="detail-panel panel-order-2" shadow="hover">
          <template #header>
            <span>因子评分明细</span>
          </template>
          <div class="factor-list">
            <div class="factor-item">
              <div class="factor-head">
                <span>流通市值 (权重22%)</span>
                <span class="factor-score">{{ result.marketScore }}分</span>
              </div>
              <el-progress :percentage="result.marketScore" :stroke-width="8" :show-text="false" color="#f97316" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>换手率 (权重22%)</span>
                <span class="factor-score">{{ result.turnoverScore }}分</span>
              </div>
              <el-progress :percentage="result.turnoverScore" :stroke-width="8" :show-text="false" color="#0ea5e9" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>量比 (权重18%)</span>
                <span class="factor-score">{{ result.volScore }}分</span>
              </div>
              <el-progress :percentage="result.volScore" :stroke-width="8" :show-text="false" color="#8b5cf6" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>5日涨幅 (权重15%)</span>
                <span class="factor-score">{{ result.gainScore }}分</span>
              </div>
              <el-progress :percentage="result.gainScore" :stroke-width="8" :show-text="false" color="#ec4899" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>振幅 (权重8%)</span>
                <span class="factor-score">{{ result.ampScore }}分</span>
              </div>
              <el-progress :percentage="result.ampScore" :stroke-width="8" :show-text="false" color="#14b8a6" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>题材热度 (权重10%)</span>
                <span class="factor-score">{{ result.themeHeat }}分</span>
              </div>
              <el-progress :percentage="result.themeHeat" :stroke-width="8" :show-text="false" color="#10b981" />
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>波动率加成</span>
                <span class="factor-score">{{ result.volaBonus >= 0 ? '+' : '' }}{{ result.volaBonus }}分</span>
              </div>
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>连涨加成</span>
                <span class="factor-score">{{ result.consecutiveBonus >= 0 ? '+' : '' }}{{ result.consecutiveBonus }}分</span>
              </div>
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>资金流向调节</span>
                <span class="factor-score" :class="result.moneyBonus >= 0 ? 'text-up' : 'text-down'">{{ result.moneyBonus >= 0 ? '+' : '' }}{{ result.moneyBonus }}分</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 阶段与目标 -->
        <el-card class="detail-panel panel-order-1" shadow="hover">
          <template #header>
            <div class="stage-title-row">
              <span>阶段研判 & 目标价位</span>
              <el-tag :type="stageTagType" size="small" effect="dark">{{ result.stageName }}</el-tag>
            </div>
          </template>
          <div class="stage-detail">
            <p class="stage-desc">{{ result.stageDesc }}</p>
            <el-divider />
            <div class="target-section">
              <div class="target-label">🎯 模型目标价位区间</div>
              <div class="target-range">
                <span class="target-low">{{ result.targetLow }}</span>
                <span class="target-sep">~</span>
                <span class="target-high">{{ result.targetHigh }}</span>
                <span class="target-unit">元</span>
              </div>
              <div class="target-note">
                基于当前价 ¥{{ result.price?.toFixed(2) }}，预估潜在涨幅
                <strong :class="result.targetUpside >= 0 ? 'text-up' : 'text-down'">
                  {{ result.targetUpside >= 0 ? '+' : '' }}{{ result.targetUpside?.toFixed(1) }}%
                </strong>
              </div>
            </div>
            <el-divider />
            <!-- 建议介入 & 止损止盈 -->
            <div class="entry-stop-section" v-if="result.entryStop">
              <div class="entry-stop-title">📊 建议介入与止损止盈</div>
              <div class="entry-stop-grid">
                <div class="es-item es-entry">
                  <span class="es-label">建议介入价</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.entryPrice }">{{ result.entryStop.entryLabel }}</span>
                </div>
                <div class="es-item es-stop">
                  <span class="es-label">建议止损价</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.stopLoss }">{{ result.entryStop.stopLabel }}</span>
                </div>
                <div class="es-item es-tp1">
                  <span class="es-label">止盈目标一</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.takeProfit1 }">{{ result.entryStop.tp1Label }}</span>
                </div>
                <div class="es-item es-tp2">
                  <span class="es-label">止盈目标二</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.takeProfit2 }">{{ result.entryStop.tp2Label }}</span>
                </div>
              </div>
              <div v-if="result.entryStop.riskRewardRatio !== null" class="es-rr">
                盈亏比 <strong :class="result.entryStop.riskRewardRatio >= 2 ? 'text-up' : 'text-warn'">{{ result.entryStop.riskRewardRatio }}:1</strong>
                <span v-if="result.entryStop.riskRewardRatio >= 3" class="es-rr-tip">（优秀）</span>
                <span v-else-if="result.entryStop.riskRewardRatio >= 2" class="es-rr-tip">（良好）</span>
                <span v-else class="es-rr-tip">（偏低）</span>
              </div>
            </div>
            <el-divider />
            <div class="launch-info">
              {{ result.launchText }}
            </div>
          </div>
        </el-card>
      </div>

      <!-- 第三行：妖股特征 + 辅助指标 -->
      <div class="detail-grid section-order-3">
        <!-- 妖股特征量化 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span>妖股特征量化</span>
          </template>
          <ul class="feature-list">
            <li><el-icon class="icon-ok"><CircleCheckFilled /></el-icon> 市值弹性：{{ result.capDesc }}</li>
            <li><el-icon class="icon-warn"><TrendCharts /></el-icon> 量价结构：{{ result.volDesc }}</li>
            <li><el-icon class="icon-warn"><Odometer /></el-icon> 换手意愿：{{ result.turnDesc }}</li>
            <li><el-icon class="icon-warn"><Histogram /></el-icon> 振幅活跃度：{{ result.ampDesc }}</li>
            <li><el-icon class="icon-warn"><DataLine /></el-icon> 短期动能(5日)：{{ result.gainDesc }}</li>
            <li v-if="result.gain10dDesc"><el-icon class="icon-warn"><DataLine /></el-icon> 中期动能(10日)：{{ result.gain10dDesc }}</li>
            <li><el-icon class="icon-warn"><Promotion /></el-icon> 题材强度：{{ result.themeDesc }}</li>
            <li v-if="result.volatility20d && isFinite(result.volatility20d)"><el-icon class="icon-warn"><TrendCharts /></el-icon> 20日波动率：{{ result.volatility20d }}%（{{ result.volatility20d > 60 ? '高波动妖股基因' : result.volatility20d > 35 ? '中等波动' : '波动偏低' }}）</li>
            <li v-if="result.consecutiveUpDays > 1"><el-icon class="icon-ok"><CircleCheckFilled /></el-icon> 连涨天数：{{ result.consecutiveUpDays }}天</li>
            <li v-if="result.ma20 && result.price"><el-icon class="icon-warn"><DataLine /></el-icon> 20日均线偏离：{{ ((result.price - result.ma20) / result.ma20 * 100).toFixed(1) }}%（{{ result.price > result.ma20 ? '站上均线' : '跌破均线' }}）</li>
          </ul>
        </el-card>

        <!-- 辅助指标 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span>辅助指标 & 多周期数据</span>
          </template>
          <div class="aux-grid">
            <!-- 资金流向 -->
            <div class="aux-item">
              <span class="aux-label">主力资金流向</span>
              <template v-if="result.moneyFlow !== 0">
                <span :class="result.moneyFlow > 0 ? 'text-up' : 'text-down'" class="aux-value">
                  {{ result.moneyFlowPrefix }}{{ result.moneyFlowAbs }}
                </span>
              </template>
              <template v-else>
                <span class="aux-value aux-neutral">无明显流向</span>
              </template>
            </div>
            <!-- 总市值 -->
            <div class="aux-item">
              <span class="aux-label">总市值</span>
              <span class="aux-value">{{ result.totalMarketCap }}亿</span>
            </div>
            <!-- 均价 -->
            <div class="aux-item">
              <span class="aux-label">当日均价</span>
              <span class="aux-value">{{ result.avgPrice?.toFixed(2) || '—' }}元</span>
            </div>
            <!-- 市盈率(动) -->
            <div class="aux-item">
              <span class="aux-label">市盈率(动)</span>
              <span class="aux-value">{{ result.peRatio?.toFixed(2) || '—' }}</span>
            </div>
            <!-- 市净率 -->
            <div class="aux-item">
              <span class="aux-label">市净率</span>
              <span class="aux-value">{{ result.pbRatio?.toFixed(2) || '—' }}</span>
            </div>
            <!-- 20日涨幅 -->
            <div class="aux-item">
              <span class="aux-label">20日涨幅</span>
              <span :class="(result.gain20dApi || 0) >= 0 ? 'text-up' : 'text-down'" class="aux-value">
                {{ (result.gain20dApi || 0) >= 0 ? '+' : '' }}{{ (result.gain20dApi || 0).toFixed(1) }}%
              </span>
            </div>
            <!-- 60日涨幅 -->
            <div class="aux-item">
              <span class="aux-label">60日涨幅</span>
              <span :class="(result.gain60dApi || 0) >= 0 ? 'text-up' : 'text-down'" class="aux-value">
                {{ (result.gain60dApi || 0) >= 0 ? '+' : '' }}{{ (result.gain60dApi || 0).toFixed(1) }}%
              </span>
            </div>
            <!-- 今年涨幅 -->
            <div class="aux-item">
              <span class="aux-label">今年涨幅</span>
              <span :class="(result.gainYtdApi || 0) >= 0 ? 'text-up' : 'text-down'" class="aux-value">
                {{ (result.gainYtdApi || 0) >= 0 ? '+' : '' }}{{ (result.gainYtdApi || 0).toFixed(1) }}%
              </span>
            </div>
            <!-- 52周最高 -->
            <div class="aux-item">
              <span class="aux-label">52周最高</span>
              <span class="aux-value text-up">{{ result.high52w?.toFixed(2) || '—' }}元</span>
            </div>
            <!-- 52周最低 -->
            <div class="aux-item">
              <span class="aux-label">52周最低</span>
              <span class="aux-value text-down">{{ result.low52w?.toFixed(2) || '—' }}元</span>
            </div>
            <!-- 外盘 -->
            <div class="aux-item">
              <span class="aux-label">外盘（主动买）</span>
              <span class="aux-value text-up">{{ result.outerVolume ? (result.outerVolume / 10000).toFixed(2) + '万手' : '—' }}</span>
            </div>
            <!-- 内盘 -->
            <div class="aux-item">
              <span class="aux-label">内盘（主动卖）</span>
              <span class="aux-value text-down">{{ result.innerVolume ? (result.innerVolume / 10000).toFixed(2) + '万手' : '—' }}</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">涨停参考价</span>
              <span class="aux-value text-up">{{ result.limitUp?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">跌停参考价</span>
              <span class="aux-value text-down">{{ result.limitDown?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">距涨停</span>
              <span class="aux-value text-up">{{ result.limitUpDist?.toFixed(1) }}%</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">20日波动率</span>
              <span class="aux-value">{{ isFinite(result.volatility20d) ? result.volatility20d + '%' : '—' }}</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">连涨天数</span>
              <span class="aux-value">{{ result.consecutiveUpDays }}天</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">20日均价</span>
              <span class="aux-value">{{ result.ma20?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">均线偏离</span>
              <span :class="result.price > result.ma20 ? 'text-up' : 'text-down'" class="aux-value">
                {{ result.ma20 && result.price ? ((result.price - result.ma20) / result.ma20 * 100).toFixed(1) + '%' : '—' }}
              </span>
            </div>
            <div class="aux-item">
              <span class="aux-label">综合评分</span>
              <span class="aux-value score-highlight">{{ result.score }}/100</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 第三行半：技术指标分析面板 -->
      <div class="section-order-tech" v-if="result.techIndicators">
        <el-card class="tech-panel" shadow="hover">
          <template #header>
            <span>技术指标分析</span>
            <span class="tech-subtitle">基于近100日K线数据计算</span>
          </template>

          <!-- KDJ + MACD 行 -->
          <div class="tech-row">
            <div class="tech-block">
              <div class="tech-block-title">
                <span class="tech-dot dot-kdj"></span> KDJ 指标
                <el-popover placement="top" :width="280" trigger="click" popper-class="tech-poper-dark">
                  <template #reference>
                    <el-icon class="tech-help-icon"><QuestionFilled /></el-icon>
                  </template>
                  <div class="tech-popover-content">
                    <p><strong>KDJ</strong> 是一种动量摆动指标，用于判断短期超买超卖状态。</p>
                    <p>• <strong>K 值</strong>（快线）：对价格最敏感的线</p>
                    <p>• <strong>D 值</strong>（慢线）：K 值的平滑线，更稳定</p>
                    <p>• <strong>J 值</strong>（加速线）：J=3K-2D，最敏感</p>
                    <p>📌 <strong>判断标准</strong>：K/D &gt; 80 为超买区，K/D &lt; 20 为超卖区；J &gt; 100 极度超买，J &lt; 0 极度超卖；K 上穿 D 为金叉（看涨），下穿为死叉（看跌）。</p>
                  </div>
                </el-popover>
              </div>
              <div class="tech-values">
                <div class="tech-val">
                  <span class="tv-label">K</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.kColor }">{{ result.techIndicators.k }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">D</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.dColor }">{{ result.techIndicators.d }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">J</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.jColor }">{{ result.techIndicators.j }}</span>
                </div>
              </div>
              <div class="tech-desc">
                <span v-if="result.techIndicators.kdjCross === 'golden'" class="signal-bull">金叉 ▲ 看涨信号</span>
                <span v-else-if="result.techIndicators.kdjCross === 'dead'" class="signal-bear">死叉 ▼ 看跌信号</span>
                <span v-else :class="result.techIndicators.kdjSignalClass">{{ result.techIndicators.kdjSignal }}</span>
              </div>
            </div>

            <div class="tech-block">
              <div class="tech-block-title">
                <span class="tech-dot dot-macd"></span> MACD 指标
                <el-popover placement="top" :width="280" trigger="click" popper-class="tech-poper-dark">
                  <template #reference>
                    <el-icon class="tech-help-icon"><QuestionFilled /></el-icon>
                  </template>
                  <div class="tech-popover-content">
                    <p><strong>MACD</strong> 是一种趋势跟踪指标，通过快慢均线的差值判断多空力量。</p>
                    <p>• <strong>DIF</strong>（快线）：12日EMA - 26日EMA，反映短期趋势</p>
                    <p>• <strong>DEA</strong>（慢线）：DIF 的 9日EMA，信号线</p>
                    <p>• <strong>柱线</strong>（BAR）：2×(DIF-DEA)，红柱多头、绿柱空头</p>
                    <p>📌 <strong>判断标准</strong>：DIF 上穿 DEA 为金叉（看涨），下穿为死叉（看跌）；DIF &gt; 0 为多头市场；柱线放大趋势加强，柱线收窄趋势减弱。</p>
                  </div>
                </el-popover>
              </div>
              <div class="tech-values">
                <div class="tech-val">
                  <span class="tv-label">DIF</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.dif >= 0 ? '#f87171' : '#4ade80' }">{{ result.techIndicators.dif }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">DEA</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.dea >= 0 ? '#f87171' : '#4ade80' }">{{ result.techIndicators.dea }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">柱</span>
                  <span class="tv-num" :style="{ color: result.techIndicators.macdBar >= 0 ? '#f87171' : '#4ade80' }">{{ result.techIndicators.macdBar }}</span>
                </div>
              </div>
              <div class="tech-desc">
                <span v-if="result.techIndicators.macdCross === 'golden'" class="signal-bull">金叉 ▲ 趋势转多</span>
                <span v-else-if="result.techIndicators.macdCross === 'dead'" class="signal-bear">死叉 ▼ 趋势转空</span>
                <span v-else :class="result.techIndicators.macdBar >= 0 ? 'signal-bull' : 'signal-bear'">
                  {{ result.techIndicators.macdBar >= 0 ? '多头主导，柱线放大则加速' : '空头主导，柱线收窄则企稳' }}
                </span>
              </div>
            </div>
          </div>

          <!-- BOLL + 量价关系 行 -->
          <div class="tech-row">
            <div class="tech-block">
              <div class="tech-block-title">
                <span class="tech-dot dot-boll"></span> 布林带 BOLL(20)
                <el-popover placement="top" :width="280" trigger="click" popper-class="tech-poper-dark">
                  <template #reference>
                    <el-icon class="tech-help-icon"><QuestionFilled /></el-icon>
                  </template>
                  <div class="tech-popover-content">
                    <p><strong>布林带</strong> 由中轨（20日均线）±2倍标准差构成，用于判断波动区间和超买超卖。</p>
                    <p>• <strong>上轨</strong>：中轨 + 2σ，压力位</p>
                    <p>• <strong>中轨</strong>：20日均线，趋势基准</p>
                    <p>• <strong>下轨</strong>：中轨 - 2σ，支撑位</p>
                    <p>📌 <strong>判断标准</strong>：价格触及上轨为超买，有回调压力；触及下轨为超卖，有反弹动力；带宽收窄预示变盘，带宽扩大表明波动加剧。</p>
                  </div>
                </el-popover>
              </div>
              <div class="tech-values">
                <div class="tech-val">
                  <span class="tv-label">上轨</span>
                  <span class="tv-num text-up">{{ result.techIndicators.bollUpper }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">中轨</span>
                  <span class="tv-num" style="color: #eab308;">{{ result.techIndicators.bollMid }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">下轨</span>
                  <span class="tv-num text-down">{{ result.techIndicators.bollLower }}</span>
                </div>
              </div>
              <div class="tech-desc">
                <span :class="result.techIndicators.bollPosition >= 0.8 ? 'signal-warn' : result.techIndicators.bollPosition <= 0.2 ? 'signal-bull' : 'signal-neutral'">
                  {{ result.techIndicators.bollDesc }}
                </span>
              </div>
            </div>
            <!-- 量价关系 -->
            <div class="tech-block">
              <div class="tech-block-title">
                <span class="tech-dot dot-volume"></span> 量价关系
                <el-popover placement="top" :width="280" trigger="click" popper-class="tech-poper-dark">
                  <template #reference>
                    <el-icon class="tech-help-icon"><QuestionFilled /></el-icon>
                  </template>
                  <div class="tech-popover-content">
                    <p><strong>量价关系</strong> 通过对比今日成交量与近5日均量，结合涨跌幅判断资金动向。</p>
                    <p>• <strong>放量上涨</strong>：量能放大且股价上涨，多头强势，趋势健康</p>
                    <p>• <strong>放量下跌</strong>：量能放大且股价下跌，资金出逃信号</p>
                    <p>• <strong>缩量上涨</strong>：上涨动力不足，谨防冲高回落</p>
                    <p>• <strong>缩量下跌</strong>：抛压减弱，可能企稳反弹</p>
                  </div>
                </el-popover>
              </div>
              <div class="tech-values tech-values-inline">
                <div class="tech-val">
                  <span class="tv-label">5日均量</span>
                  <span class="tv-num">{{ result.techIndicators.avgVol5d }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">今日量</span>
                  <span class="tv-num" :class="result.techIndicators.volRatio5d >= 1.5 ? 'text-up' : result.techIndicators.volRatio5d >= 0.8 ? '' : 'text-down'">{{ result.techIndicators.todayVol }}</span>
                </div>
                <div class="tech-val">
                  <span class="tv-label">量比(5日)</span>
                  <span class="tv-num" :class="result.techIndicators.volRatio5d >= 1.5 ? 'text-up' : result.techIndicators.volRatio5d >= 0.8 ? '' : 'text-down'">{{ result.techIndicators.volRatio5d }}x</span>
                </div>
              </div>
              <div class="tech-desc">
                <span :class="result.techIndicators.volPriceClass">
                  {{ result.techIndicators.volPriceDesc }}
                </span>
              </div>
            </div>
          </div>

          <!-- 支撑压力位 行 -->
          <div class="tech-row">
            <div class="tech-block tech-block-full">
              <div class="tech-block-title">
                <span class="tech-dot dot-support"></span> 支撑压力位（多层级）
                <el-popover placement="top" :width="300" trigger="click" popper-class="tech-poper-dark">
                  <template #reference>
                    <el-icon class="tech-help-icon"><QuestionFilled /></el-icon>
                  </template>
                  <div class="tech-popover-content">
                    <p><strong>多层级支撑压力位</strong> 综合BOLL上下轨、20/60日高低点、MA5/MA10/MA20/MA60均线计算。</p>
                    <p>• <strong>压力位</strong>：价格上方最近的阻力（按距离排序）</p>
                    <p>• <strong>支撑位</strong>：价格下方最近的支撑（按距离排序）</p>
                    <p>📌 <strong>参考意义</strong>：突破最近压力位可看高一线；跌破最近支撑位需警惕进一步下跌。</p>
                  </div>
                </el-popover>
              </div>
              <!-- 价格阶梯图：现价锚定50%，压力/支撑按距离比例缩放 -->
              <div class="price-ladder">
                <!-- 压力位（从上到下：远→近） -->
                <div v-for="(p, idx) in [...result.techIndicators.pressureLevels].reverse()" :key="'p'+idx"
                     class="ladder-row ladder-pressure"
                     :style="{ opacity: 1 - idx * 0.15 }">
                  <div class="ladder-bar" :style="{ width: Math.min(Math.max(50 + p.dist * 2, 8), 80) + '%' }"></div>
                  <div class="ladder-info">
                    <span class="ladder-name">{{ p.name }}</span>
                    <span class="ladder-price text-up">{{ p.val }}</span>
                    <span class="ladder-dist text-up">+{{ p.dist }}%</span>
                  </div>
                </div>
                <!-- 现价线：固定50%锚点 -->
                <div class="ladder-row ladder-current">
                  <div class="ladder-bar ladder-bar-current"></div>
                  <div class="ladder-info">
                    <span class="ladder-name">✦ 现价</span>
                    <span class="ladder-price">{{ result.price?.toFixed(2) }}</span>
                    <span class="ladder-dist">{{ result.changePct >= 0 ? '+' : '' }}{{ result.changePct?.toFixed(2) }}%</span>
                  </div>
                </div>
                <!-- 支撑位（从上到下：近→远） -->
                <div v-for="(s, idx) in result.techIndicators.supportLevels" :key="'s'+idx"
                     class="ladder-row ladder-support"
                     :style="{ opacity: 1 - idx * 0.15 }">
                  <div class="ladder-bar" :style="{ width: Math.min(Math.max(50 + s.dist * 2, 8), 80) + '%' }"></div>
                  <div class="ladder-info">
                    <span class="ladder-name">{{ s.name }}</span>
                    <span class="ladder-price text-down">{{ s.val }}</span>
                    <span class="ladder-dist text-down">-{{ s.dist }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </el-card>
      </div>

      <!-- 技术指标加载失败/数据不足兜底（K线接口慢或超时时展示，可手动重试） -->
      <div class="section-order-tech" v-else-if="klineFailReason">
        <el-card class="tech-panel" shadow="hover">
          <template #header>
            <span>技术指标分析</span>
            <span class="tech-subtitle">基于近100日K线数据计算</span>
          </template>
          <div class="tech-fallback">
            <el-icon class="tech-fallback-icon"><WarningFilled /></el-icon>
            <div class="tech-fallback-text">
              <template v-if="klineFailReason === 'insufficient'">K线数据不足（需至少20根K线），技术指标暂无法计算</template>
              <template v-else>K线数据加载失败（上游接口响应慢或超时），技术指标暂无法计算</template>
            </div>
            <el-button type="warning" plain size="small" :loading="klineRetrying" @click="retryKline">
              重新加载K线
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 第四行：操盘策略 -->
      <el-card class="strategy-panel section-order-4" shadow="hover">
        <template #header>
          <span>操盘策略参考</span>
        </template>
        <div class="strategy-content">
          <!-- 策略概述 -->
          <el-alert
            :type="result.stageType === 'risk' ? 'error' : result.stageType === 'early' ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            <template #title>
              <strong>{{ result.strategyText }}</strong>
            </template>
          </el-alert>

          <!-- 策略要点卡片 -->
          <div class="strategy-cards">
            <div class="strategy-card">
              <div class="sc-icon sc-icon-position">
                <el-icon><Odometer /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">建议仓位</span>
                <span class="sc-value">{{ result.strategyTips?.position || '观望' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-cycle">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">持仓周期</span>
                <span class="sc-value">{{ result.strategyTips?.cycle || '待定' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-rule">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">核心纪律</span>
                <span class="sc-value">{{ result.strategyTips?.rule || '严格止损' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-focus">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">盯盘重点</span>
                <span class="sc-value">{{ result.strategyTips?.focus || '量价配合' }}</span>
              </div>
            </div>
          </div>

          <!-- 操作要点 -->
          <div class="strategy-checklist">
            <div class="checklist-title">操作要点</div>
            <div class="checklist-item" v-for="(tip, idx) in (result.strategyTips?.checklist || [])" :key="idx">
              <el-icon class="check-icon"><CircleCheckFilled /></el-icon>
              <span>{{ tip }}</span>
            </div>
          </div>

          <!-- 风险提示 -->
          <div class="risk-reminder">
            <el-icon><WarningFilled /></el-icon>
            <span>妖股波动巨大，单日振幅可达±10%~±20%。以上策略仅为模型推演，请结合自身风险承受能力决策。止损纪律是妖股交易的生命线，切勿扛单。</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="footer-note">
      <el-icon><InfoFilled /></el-icon>
      评分权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 题材热度(15%) + 振幅(8%)。附加波动率、连涨天数、资金流向动态调节（缩放50%）。数据来自腾讯财经 & 东方财富，仅供研究参考。
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, Clock, DataAnalysis, DataLine, TrendCharts, Histogram,
  CircleCheckFilled, Odometer, Promotion, Opportunity, WarningFilled,
  InfoFilled, Setting, QuestionFilled
} from '@element-plus/icons-vue'
import { SMA, calcRSI, calcMACD, detectCross } from '@/utils/stockAnalysis.js'
import PositionManager from './PositionManager.vue'
import { calcPosition } from '@/composables/usePosition.js'

const route = useRoute()
const stockCode = ref('')
const stockName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const result = ref(null)
const positionData = ref(null) // 当前持仓数据
const klineFailReason = ref('') // K线失败原因: '' | 'failed' | 'insufficient'，控制技术指标兜底展示
const klineRetrying = ref(false) // 技术指标重试中
let abortController = null

// ==================== 数据获取（复用主页面逻辑） ====================
async function fetchRealTime(codeRaw) {
  let code = codeRaw.toString().trim()
  if (!code.startsWith('sh') && !code.startsWith('sz')) {
    code = /^6/.test(code) ? 'sh' + code : 'sz' + code
  }
  const url = `/staticTool/api/qt/q=${code}`
  const response = await fetch(url, { signal: abortController?.signal })

  // 后端已将 GBK 转 UTF-8，直接用 text() 获取
  const text = await response.text()

  const match = text.match(/="(.+)"/)
  if (!match) throw new Error('未获取到行情数据')
  const parts = match[1].split('~')
  if (parts.length < 45) throw new Error('行情数据格式异常')

  const price = parseFloat(parts[3]) || 0
  const yesterdayClose = parseFloat(parts[4]) || 0
  // parts[44] 是流通市值(亿)，直接使用，不需要再乘以价格
  const marketCapRaw = parseFloat(parts[44]) || 0
  // parts[45] 总市值(亿)
  const totalMarketCapRaw = parseFloat(parts[45]) || 0
  // 振幅：优先用腾讯直接返回的 parts[43]，兜底用 (high-low)/昨收
  const high = parseFloat(parts[33]) || 0
  const low = parseFloat(parts[34]) || 0
  const amplitude = parseFloat(parts[43]) > 0
    ? parseFloat(parts[43])
    : (yesterdayClose > 0 ? ((high - low) / yesterdayClose * 100) : 0)

  return {
    name: parts[1],
    price,
    yesterdayClose,
    open: parseFloat(parts[5]) || 0,
    high,
    low,
    volumeHand: parseInt(parts[36]) || 0,         // 成交量(手) — parts[36]
    amountWan: parseFloat(parts[37]) || 0,         // 成交额(万) — parts[37]
    // 量比：parts[46] 是实时量比（盘中），用 K 线计算全天量比更准确
    volumeRatio: parseFloat(parts[46]) || 1,
    innerVolume: parseInt(parts[7]) || 0,          // 内盘(手) — parts[7]
    outerVolume: parseInt(parts[6]) || 0,          // 外盘(手) — parts[6]
    committeeBuy: parseInt(parts[10]) || 0,        // 委买量 — parts[10]
    committeeRatio: parseFloat(parts[74]) || 0,    // 委比% — parts[74]
    changePct: price && yesterdayClose
      ? ((price - yesterdayClose) / yesterdayClose * 100)
      : 0,
    turnoverRaw: parseFloat(parts[38]) || 0,       // 换手率% — parts[38]
    marketCapRaw: +marketCapRaw.toFixed(2),
    totalMarketCapRaw: +totalMarketCapRaw.toFixed(2),
    avgPrice: parseFloat(parts[51]) || 0,          // 均价 — parts[51]
    limitUpPrice: parseFloat(parts[47]) || 0,      // 涨停价 — parts[47]
    limitDownPrice: parseFloat(parts[48]) || 0,    // 跌停价 — parts[48]
    pbRatio: parseFloat(parts[49]) || 0,           // 市净率 — parts[49]
    peRatio: parseFloat(parts[39]) || 0,           // 市盈率(动) — parts[39]
    // 涨幅类（直接用接口值）
    gain5dBackend: parseFloat(parts[63]) || 0,      // 5日涨幅% — parts[63]
    gain20dBackend: parseFloat(parts[70]) || 0,     // 20日涨幅% — parts[70]
    gain60dBackend: parseFloat(parts[71]) || 0,     // 60日涨幅% — parts[71]
    gain10dBackend: parseFloat(parts[69]) || 0,     // 10日涨幅% — parts[69]
    gainYtdBackend: parseFloat(parts[62]) || 0,     // 今年涨幅% — parts[62]
    // 52周高/低
    high52w: parseFloat(parts[67]) || 0,           // 52周最高 — parts[67]
    low52w: parseFloat(parts[68]) || 0,            // 52周最低 — parts[68]
    // 股本
    totalShares: parseInt(parts[73]) || 0,         // 总股本(股) — parts[73]
    floatShares: parseInt(parts[72]) || 0,         // 流通股(股) — parts[72]
    amplitude: +amplitude.toFixed(2)
  }
}

async function fetchKline(codeRaw, days = 100) {
  let code = codeRaw.toString().trim()
  let market
  if (code.startsWith('sh')) {
    market = 'sh'
    code = code.replace('sh', '')
  } else if (code.startsWith('sz')) {
    market = 'sz'
    code = code.replace('sz', '')
  } else if (/^6/.test(code)) {
    market = 'sh'
  } else {
    market = 'sz'
  }
  const url = `/staticTool/api/ifzq/appstock/app/fqkline/get?param=${market}${code},day,,,${days},qfq`
  const response = await fetch(url, { signal: abortController?.signal })
  if (!response.ok) throw new Error(`K线请求失败 HTTP ${response.status}`)
  const json = await response.json()
  const dataKey = `${market}${code}`
  const klines = json?.data?.[dataKey]?.day || json?.data?.[dataKey]?.qfqday
  if (!klines?.length) throw new Error('K线数据获取失败')
  return klines.map((item, idx, arr) => {
    const close = parseFloat(item[2])
    let changePct = 0
    if (idx > 0) {
      const prevClose = parseFloat(arr[idx - 1][2])
      if (prevClose > 0) changePct = (close - prevClose) / prevClose * 100
    }
    // K线数据格式：[日期, 开盘, 收盘, 最高, 最低, 成交量, 成交额]
    return {
      date: item[0],
      open: parseFloat(item[1]),
      close,
      high: parseFloat(item[3]),
      low: parseFloat(item[4]),
      volume: parseInt(item[5]) || 0,
      amount: parseFloat(item[6]) || 0,
      changePct: +changePct.toFixed(2)
    }
  })
}

/**
 * 判断当前市场状态
 * A股交易时间：周一至周五 9:15-11:30, 13:00-15:00
 * - 盘前：0:00-9:15（非交易日全天显示"已收盘"）
 * - 早盘：9:15-11:30
 * - 午休：11:30-13:00
 * - 午盘：13:00-15:00
 * - 盘后：15:00-24:00
 */
function getMarketStatus() {
  const now = new Date()
  const day = now.getDay() // 0=周日, 6=周六
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const time = hours * 100 + minutes

  // 周末
  if (day === 0 || day === 6) {
    return { label: '已收盘', type: 'info' }
  }

  // 盘前 0:00-9:15
  if (time < 915) {
    return { label: '盘前', type: 'warning' }
  }
  // 早盘 9:15-11:30
  if (time >= 915 && time < 1130) {
    return { label: '交易中', type: 'success' }
  }
  // 午休 11:30-13:00
  if (time >= 1130 && time < 1300) {
    return { label: '午间休市', type: 'warning' }
  }
  // 午盘 13:00-15:00
  if (time >= 1300 && time < 1500) {
    return { label: '交易中', type: 'success' }
  }
  // 盘后 15:00-24:00
  return { label: '已收盘', type: 'info' }
}

function extractFactors(realtime, klines) {
  const { price, volumeRatio, turnoverRaw, marketCapRaw, changePct, amountWan, amplitude } = realtime
  const name = realtime.name || ''

  let turnover = turnoverRaw
  if (!turnover && marketCapRaw > 0 && amountWan > 0) {
    turnover = (amountWan * 10000) / (marketCapRaw * 1e8) * 100
  }
  // 换手率上限：次新股/极端活跃可能超50%，clamp到60防止极端值
  turnover = Math.min(turnover || 0, 60)

  // 5日涨幅 = (今日收盘 - 5日前收盘) / 5日前收盘 * 100
  let gain5d = changePct
  if (klines?.length >= 6) {
    const recent5 = klines.slice(-5)
    const startClose = recent5[0].open || recent5[0].close
    const endClose = recent5[recent5.length - 1].close
    if (startClose > 0) {
      gain5d = (endClose - startClose) / startClose * 100
    }
  }

  // 10日涨幅 = (今日收盘 - 10日前收盘) / 10日前收盘 * 100
  let gain10d = changePct
  if (klines?.length >= 11) {
    const recent10 = klines.slice(-10)
    const startClose = recent10[0].open || recent10[0].close
    const endClose = recent10[recent10.length - 1].close
    if (startClose > 0) {
      gain10d = (endClose - startClose) / startClose * 100
    }
  }

  // 20日均价
  let ma20 = price
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    ma20 = recent20.reduce((s, k) => s + k.close, 0) / 20
  }

  // 全天量比：用今日成交量 / 过去5日均量（不含今日）
  // 优于腾讯实时量比（盘中数据），更接近东方财富的"全天量比"
  let fullDayVolumeRatio = volumeRatio
  if (klines?.length >= 6) {
    const todayVol = klines[klines.length - 1].volume
    const prev5Sum = klines.slice(-6, -1).reduce((s, k) => s + k.volume, 0)
    const prev5Avg = prev5Sum / 5
    if (prev5Avg > 0) {
      const calcRatio = +(todayVol / prev5Avg).toFixed(2)
      // 优先用 K 线计算的全天量比，更符合东财的显示逻辑
      fullDayVolumeRatio = calcRatio
    }
  }

  // 题材热度：综合名称关键词 + 概念板块 + 涨幅动能
  let themeHeat = 50
  // 核心热门概念（2025-2026 热点方向）
  const hotConcepts = [
    '科技', '智能', 'AI', '人工智能', '半导体', '芯片', '光刻', 'EDA',
    '新能源', '光伏', '储能', '固态电池', '钠电池', '氢能',
    '机器人', '机器', '自动化', '工业母机',
    '低空经济', '商业航天', '航天', '卫星', '无人机', '飞行汽车',
    '量子', '量子计算', '量子通信',
    '合成生物', '创新药', 'CXO', '生物', '基因',
    '数据', '数据要素', '数字经济', '信创', '信息安全',
    '算力', '服务器', '光模块', 'CPO', '液冷',
    '消费电子', 'MR', 'VR', 'AR', '元宇宙',
    '汽车', '智驾', '自动驾驶', '车路云', '一体化压铸',
    '电力', '电网', '特高压', '虚拟电厂',
    '军工', '国防', '大飞机',
    '金融科技', '数字货币', '跨境支付'
  ]
  let conceptHits = 0
  for (const kw of hotConcepts) {
    if (name.includes(kw)) conceptHits++
  }
  // 命中数分级加分（避免名字超长堆叠大量关键词）
  if (conceptHits >= 4) themeHeat += 30
  else if (conceptHits >= 3) themeHeat += 22
  else if (conceptHits >= 2) themeHeat += 14
  else if (conceptHits >= 1) themeHeat += 7
  // ST 股惩罚
  if (name.includes('ST') || name.includes('*ST')) themeHeat -= 35
  // 涨幅动能调节
  if (gain5d > 20) themeHeat += 15
  else if (gain5d > 12) themeHeat += 8
  else if (gain5d > 5) themeHeat += 3
  else if (gain5d < -8) themeHeat -= 15
  else if (gain5d < -3) themeHeat -= 5
  themeHeat = Math.min(98, Math.max(10, themeHeat))

  // 资金流向
  let moneyFlow = 0
  if (klines?.length >= 10) {
    const recent5Avg = klines.slice(-5).reduce((s, k) => s + (k.amount || 0), 0) / 5
    const prev5Avg = klines.slice(-10, -5).reduce((s, k) => s + (k.amount || 0), 0) / 5
    if (prev5Avg > 0) {
      const ratio = recent5Avg / prev5Avg
      if (ratio > 1.3 && changePct > 0) moneyFlow = Math.min(ratio * 6, 15)
      else if (ratio > 1.1) moneyFlow = Math.min(ratio * 2, 6)
      else if (ratio < 0.85 && changePct < 0) moneyFlow = -Math.min((1 / ratio) * 2.5, 10)
      else if (ratio < 0.92) moneyFlow = -2
    }
  }

  // 20日波动率
  let volatility20d = 0
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    const returns = recent20.map(k => k.changePct || 0)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    volatility20d = Math.sqrt(variance) * Math.sqrt(250)
  }

  // 连涨天数
  let consecutiveUpDays = 0
  if (klines?.length) {
    for (let i = klines.length - 1; i >= 0; i--) {
      if (klines[i].changePct > 0) consecutiveUpDays++
      else break
    }
  }

  // 连板基因：历史上有过连板记录（涨跌幅>9.5%且次日继续大涨>5%）
  let hasConsecutiveLimitUp = false
  if (klines?.length >= 2) {
    for (let i = 1; i < klines.length; i++) {
      if (klines[i].changePct > 9.5 && klines[i - 1].changePct > 5) {
        hasConsecutiveLimitUp = true
        break
      }
    }
  }

  // 一字板检测：今日是否一字板（开盘价≈收盘价，涨跌幅>9.5%，换手率极低）
  const isYiZiBan = klines?.length && Math.abs(klines[klines.length - 1].open - klines[klines.length - 1].close) < 0.01
    && Math.abs(changePct) > 9.5 && turnoverRaw < 1

  // 市场环境因子：基于20日市场平均涨跌幅
  let marketEnv = 0 // -1=熊市, 0=震荡, 1=牛市
  if (klines?.length >= 20) {
    const avg20dChange = klines.slice(-20).reduce((s, k) => s + (k.changePct || 0), 0) / 20
    if (avg20dChange > 0.5) marketEnv = 1
    else if (avg20dChange < -0.5) marketEnv = -1
  }

  return {
    marketCap: marketCapRaw || 50, turnover, volumeRatio: fullDayVolumeRatio || 1,
    gain5d: +gain5d.toFixed(2), gain10d: +gain10d.toFixed(2),
    themeHeat: Math.round(themeHeat),
    moneyFlow: isFinite(moneyFlow) ? +moneyFlow.toFixed(1) : 0, price, changePct,
    volatility20d: isFinite(volatility20d) ? +volatility20d.toFixed(1) : 0, consecutiveUpDays,
    amplitude: amplitude || 0, ma20: +ma20.toFixed(2),
    hasConsecutiveLimitUp, isYiZiBan, marketEnv
  }
}

function computeScores(factors) {
  const { marketCap, turnover, volumeRatio, gain5d, themeHeat, moneyFlow, volatility20d, consecutiveUpDays, amplitude,
    changePct, hasConsecutiveLimitUp, isYiZiBan, marketEnv } = factors

  // 流通市值评分（细分 5 亿以下，极小盘流动性差不应得高分）
  let marketScore
  if (marketCap <= 3) marketScore = 20      // 微型僵尸股，几乎无流动性
  else if (marketCap <= 5) marketScore = 35  // 极小盘，流动性风险高
  else if (marketCap <= 15) marketScore = 92
  else if (marketCap <= 25) marketScore = 95
  else if (marketCap <= 50) marketScore = 82
  else if (marketCap <= 80) marketScore = 65
  else if (marketCap <= 120) marketScore = 48
  else if (marketCap <= 200) marketScore = 28
  else marketScore = 12

  // 换手率评分
  let turnoverScore
  if (turnover >= 8 && turnover <= 25) turnoverScore = 95
  else if (turnover >= 5 && turnover < 8) turnoverScore = 72
  else if (turnover > 25 && turnover <= 35) turnoverScore = 55
  else if (turnover > 35 && turnover <= 45) turnoverScore = 30
  else if (turnover > 45 && turnover <= 55) turnoverScore = 18
  else if (turnover > 55) turnoverScore = 10
  else if (turnover < 1) turnoverScore = 0   // 僵尸股
  else if (turnover < 3) turnoverScore = 10
  else if (turnover < 5) turnoverScore = 25
  else turnoverScore = 12

  // 量比评分（加入方向因子：放量上涨加分，放量下跌扣分）
  let volScore
  if (volumeRatio >= 3.0) volScore = 95
  else if (volumeRatio >= 2.5) volScore = 88
  else if (volumeRatio >= 1.8) volScore = 78
  else if (volumeRatio >= 1.3) volScore = 60
  else if (volumeRatio >= 0.9) volScore = 40
  else if (volumeRatio >= 0.5) volScore = 20
  else volScore = 8
  // 方向调节：放量下跌扣分，放量上涨加分；缩量涨跌影响较弱
  const directionAdj = (changePct >= 0 ? 1 : -1) * Math.min(Math.abs(changePct) * 2, 15)
  volScore = Math.round(Math.max(5, Math.min(100, volScore + directionAdj)))

  // 5日涨幅评分（细分负值区间）
  let gainScore
  if (gain5d >= 10 && gain5d <= 35) gainScore = 95
  else if (gain5d >= 5 && gain5d < 10) gainScore = 75
  else if (gain5d >= 1 && gain5d < 5) gainScore = 55
  else if (gain5d > 35 && gain5d <= 50) gainScore = 45
  else if (gain5d >= 0 && gain5d < 1) gainScore = 35
  else if (gain5d > -5 && gain5d < 0) gainScore = 25
  else if (gain5d > -10 && gain5d <= -5) gainScore = 15
  else if (gain5d > -20 && gain5d <= -10) gainScore = 8
  else gainScore = 5  // 跌超20%，严重弱势

  // 一字板惩罚：一字板无换手无法介入，妖股评分应打折
  if (isYiZiBan) {
    gainScore = Math.max(10, gainScore - 20)
    turnoverScore = Math.max(5, turnoverScore - 25)
  }

  // 振幅评分
  let ampScore = 0
  if (amplitude >= 8) ampScore = 95
  else if (amplitude >= 6) ampScore = 82
  else if (amplitude >= 4) ampScore = 65
  else if (amplitude >= 2.5) ampScore = 45
  else ampScore = 20

  // 附加调节
  let volaBonus = 0
  if (volatility20d > 80) volaBonus = 8
  else if (volatility20d > 60) volaBonus = 5
  else if (volatility20d > 40) volaBonus = 2

  let consecutiveBonus = Math.min(Math.round(consecutiveUpDays * 1.5 * 10) / 10, 8)

  // 连板基因加成：历史上连板过的股票再次成妖概率更高
  let geneBonus = hasConsecutiveLimitUp ? 3 : 0

  let moneyBonus = moneyFlow > 4 ? 12 : moneyFlow > 2 ? 8 : moneyFlow > 1 ? 4 : moneyFlow < -3 ? -12 : moneyFlow < -1 ? -5 : 0

  // 权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 题材热度(15%) + 振幅(8%) = 100%
  let total = marketScore * 0.22 + turnoverScore * 0.22 + volScore * 0.18 + gainScore * 0.15 + themeHeat * 0.15 + ampScore * 0.08
  // 加成项经过 0.5 缩放，避免加成占比过大（上限：8+8+12+3=31 → 15.5）
  total += (volaBonus + consecutiveBonus + moneyBonus + geneBonus) * 0.5
  // 市场环境调节：牛市+3分，熊市-3分
  total += marketEnv * 3
  total = Math.min(100, Math.max(10, Math.round(total)))
  return { total, marketScore, turnoverScore, volScore, gainScore, ampScore, volaBonus, consecutiveBonus, moneyBonus }
}

function getStage(factors, score) {
  const { gain5d, turnover, volumeRatio } = factors
  // 评分影响阶段判断的敏感度：高分股票更容易被判定为有利阶段
  const scoreBias = (score - 50) / 100 // -0.4 ~ +0.5

  if (gain5d >= (2 - scoreBias * 1.5) && gain5d < (12 + scoreBias * 3) && volumeRatio >= (1.2 - scoreBias * 0.3) && turnover >= (5 - scoreBias * 1) && turnover < (15 + scoreBias * 3)) {
    return { name: '启动前·蓄力突破', type: 'pre', desc: '量价温和配合，主力低位吸筹迹象明显。当前处于蓄势阶段，等待放量阳线确认启动信号。' }
  }
  if (gain5d >= (8 - scoreBias * 2) && gain5d < (25 + scoreBias * 3) && volumeRatio >= (1.8 - scoreBias * 0.3) && turnover >= (8 - scoreBias * 1) && turnover <= (30 + scoreBias * 3)) {
    return { name: '启动初期·主升浪开端', type: 'early', desc: '资金抢筹意愿强烈，量价共振突破，妖气初显。短期爆发力强劲，为最佳介入窗口期。' }
  }
  if (gain5d >= (20 - scoreBias * 2) && gain5d <= (48 + scoreBias * 5) && turnover >= (12 - scoreBias * 2) && turnover <= (30 + scoreBias * 3) && volumeRatio >= (2.2 - scoreBias * 0.3)) {
    return { name: '主升浪中·妖性绽放', type: 'mid', desc: '连板或大阳线持续，市场情绪高度一致。注意高位分歧信号，持仓者需紧盯分时承接。' }
  }
  if (gain5d > 45 || (turnover > 32 && gain5d < 8) || (volumeRatio < 1.2 && gain5d > 20)) {
    return { name: '高风险区·鱼尾行情', type: 'risk', desc: '换手率异常或缩量滞涨，追高风险极大。可能已进入出货阶段，建议谨慎对待。' }
  }
  if (gain5d < 2 && turnover < 6 && volumeRatio < 0.9) {
    return { name: '冷门低迷期', type: 'cold', desc: '缺乏资金关注，交投清淡，暂不具备妖股启动条件。需等待题材催化或资金入场。' }
  }
  if (gain5d >= (12 - scoreBias * 2) && gain5d < (22 + scoreBias * 3)) {
    return { name: '启动确认·上涨中继', type: 'early', desc: '空中加油形态，短暂整理后有望继续上行。量能维持健康，仍有上行空间。' }
  }
  return { name: '震荡试盘阶段', type: 'pre', desc: '主力试探性拉升，需放量确认方向。关注后续异动信号，可能酝酿突破。' }
}

function getTargetPrice(price, stageType, score, gain5d) {
  let lowerRatio, upperRatio
  if (stageType === 'pre') { lowerRatio = 0.15; upperRatio = 0.35 }
  else if (stageType === 'early') { lowerRatio = 0.22; upperRatio = 0.50 }
  else if (stageType === 'mid') { lowerRatio = 0.10; upperRatio = 0.25 }
  else { lowerRatio = -0.08; upperRatio = 0.10 }
  // 根据评分和当前涨幅动态调节
  let adjust = 1 + (score - 50) / 200
  if (gain5d > 30) adjust *= 0.85  // 已大幅上涨，降低预期
  adjust = Math.min(1.3, Math.max(0.75, adjust))
  return {
    low: (price * (1 + lowerRatio * adjust)).toFixed(2),
    high: (price * (1 + upperRatio * adjust)).toFixed(2)
  }
}

/**
 * 计算建议介入价、止损价、止盈价
 *
 * 核心逻辑：
 * - 介入价 = 当前价 × (1 - 回调比例)，回调比例受阶段、评分、涨幅、振幅、市值综合影响
 * - 止损价 = 介入价 × (1 - 止损比例)，止损比例以介入价为基准（而非当前价），更合理
 * - 止盈价 = 介入价 × (1 + 止盈比例)，止盈比例基于阶段+评分+振幅动态调节
 * - 盈亏比 = (目标二 - 介入价) : (介入价 - 止损价)，采用目标二作为潜在收益（保守取目标一也可）
 *
 * 关键改进：
 * 1. 介入价和止损价独立调整，不再共用同一个 multiplier
 * 2. 止损以介入价为锚点，而非当前价
 * 3. 止盈考虑振幅补偿——高振幅股票止盈目标应更高
 * 4. 评分对介入/止损/止盈的影响方向不同
 * 5. 增加均线参考（后续可扩展）
 */
function getEntryStopPrice(price, stageType, score, gain5d, amplitude, marketCap, turnover, ma20) {
  // 不可介入阶段
  if (stageType === 'risk' || stageType === 'cold') {
    return {
      entryPrice: null, stopLoss: null, takeProfit1: null, takeProfit2: null,
      entryLabel: '暂不建议介入', stopLabel: '—', tp1Label: '—', tp2Label: '—',
      riskRewardRatio: null
    }
  }

  // ========== 1. 基础参数（按阶段设定） ==========
  let basePullback, baseStopLoss, baseTP1, baseTP2

  switch (stageType) {
    case 'pre':
      // 蓄力突破：回调3%左右介入，止损5%，止盈目标适中
      basePullback = 0.030
      baseStopLoss = 0.050   // 相对于介入价的止损比例
      baseTP1 = 0.15
      baseTP2 = 0.25
      break
    case 'early':
      // 启动初期：小幅回调即可介入（2%），紧止损（4%），高止盈预期
      basePullback = 0.020
      baseStopLoss = 0.040
      baseTP1 = 0.18
      baseTP2 = 0.30
      break
    case 'mid':
      // 主升浪中：需要更大回调才安全（5%），宽止损防洗盘（7%），降低止盈预期
      basePullback = 0.050
      baseStopLoss = 0.070
      baseTP1 = 0.12
      baseTP2 = 0.20
      break
    default:
      basePullback = 0.040
      baseStopLoss = 0.060
      baseTP1 = 0.12
      baseTP2 = 0.22
  }

  // ========== 2. 动态调节系数 ==========

  // 2a. 评分因子（0.7~1.3）
  // 评分越高 → 回调介入可以更积极（少等回调），止损可略微放宽
  const scoreFactor = 0.7 + (score / 100) * 0.6
  // 介入价回调比例：评分高 → 少回调（积极介入），评分低 → 多回调（保守等待）
  const pullbackScoreAdj = 1.5 - (score / 100) * 0.8  // 范围：0.7~1.4
  // 止损比例：评分高 → 止损略宽（信任评分），评分低 → 止损紧（严格风控）
  const stopScoreAdj = 0.7 + (score / 100) * 0.6  // 范围：0.7~1.3

  // 2b. 涨幅因子——已涨越多，回调需求越大
  // 5日涨幅超过15%：需要更深的回调才安全
  let gainPullbackAdj = 1.0
  if (gain5d > 35) gainPullbackAdj = 1.8
  else if (gain5d > 25) gainPullbackAdj = 1.5
  else if (gain5d > 15) gainPullbackAdj = 1.25
  else if (gain5d > 8) gainPullbackAdj = 1.1
  else if (gain5d < 0) gainPullbackAdj = 0.85  // 已回调过，可稍积极

  // 涨幅对止损的影响：涨幅大 → 止损需放宽以防震出
  let gainStopAdj = 1.0
  if (gain5d > 30) gainStopAdj = 1.35
  else if (gain5d > 20) gainStopAdj = 1.2
  else if (gain5d > 10) gainStopAdj = 1.08
  else if (gain5d < -3) gainStopAdj = 0.9  // 已跌较多，止损收窄

  // 2c. 振幅因子——高振幅股票需要更宽的止损和更高的止盈目标
  let ampStopAdj = 1.0
  let ampTPAdj = 1.0
  if (amplitude > 12) { ampStopAdj = 1.4; ampTPAdj = 1.25 }
  else if (amplitude > 8) { ampStopAdj = 1.2; ampTPAdj = 1.12 }
  else if (amplitude > 5) { ampStopAdj = 1.08; ampTPAdj = 1.05 }
  else if (amplitude < 3) { ampStopAdj = 0.9; ampTPAdj = 0.9 }

  // 2d. 市值因子——小市值波动大
  let capStopAdj = 1.0
  if (marketCap < 15) capStopAdj = 1.2
  else if (marketCap < 30) capStopAdj = 1.1
  else if (marketCap < 50) capStopAdj = 1.05
  else if (marketCap > 150) capStopAdj = 0.9

  // 2e. 换手率因子——高换手意味着活跃度高，止损可略紧（流动性好）
  let turnoverAdj = 1.0
  if (turnover > 30) turnoverAdj = 0.9
  else if (turnover > 20) turnoverAdj = 0.95
  else if (turnover < 5) turnoverAdj = 1.1  // 低换手，流动性差，止损宽一点

  // ========== 3. 综合计算 ==========

  // 介入价回调比例（综合所有因子）
  const adjustedPullback = Math.min(
    basePullback * pullbackScoreAdj * gainPullbackAdj,
    0.12  // 回调上限12%
  )
  const adjustedPullbackClamped = Math.max(adjustedPullback, 0.01)  // 回调下限1%

  // 止损比例（以介入价为基准）
  const adjustedStopRatio = Math.min(
    baseStopLoss * stopScoreAdj * gainStopAdj * ampStopAdj * capStopAdj * turnoverAdj,
    0.12  // 止损上限12%
  )
  const adjustedStopRatioClamped = Math.max(adjustedStopRatio, 0.025)  // 止损下限2.5%

  // 止盈比例（以介入价为基准）
  const tp1Ratio = Math.min(baseTP1 * scoreFactor * ampTPAdj, 0.35)
  const tp2Ratio = Math.min(baseTP2 * scoreFactor * ampTPAdj, 0.55)

  // 计算具体价格
  let entryPrice = +(price * (1 - adjustedPullbackClamped)).toFixed(2)

  // 均线支撑参考：如果回调后的介入价低于MA20，取MA20作为介入价底线
  // MA20通常为中期支撑位，不应轻易跌破
  if (ma20 && ma20 > 0 && entryPrice < ma20 && ma20 < price) {
    entryPrice = +ma20.toFixed(2)
  }

  const stopLoss = +(entryPrice * (1 - adjustedStopRatioClamped)).toFixed(2)
  const takeProfit1 = +(entryPrice * (1 + tp1Ratio)).toFixed(2)
  const takeProfit2 = +(entryPrice * (1 + tp2Ratio)).toFixed(2)

  // ========== 4. 盈亏比 ==========
  // 使用目标二作为潜在收益，更体现妖股的爆发潜力
  const riskPerShare = entryPrice - stopLoss
  const rewardPerShare = takeProfit2 - entryPrice
  const riskRewardRatio = riskPerShare > 0 ? +(rewardPerShare / riskPerShare).toFixed(1) : null

  // 标签文案
  const entryPct = ((price - entryPrice) / price * 100).toFixed(1)
  const stopPct = ((entryPrice - stopLoss) / entryPrice * 100).toFixed(1)
  const tp1Pct = ((takeProfit1 - entryPrice) / entryPrice * 100).toFixed(1)
  const tp2Pct = ((takeProfit2 - entryPrice) / entryPrice * 100).toFixed(1)

  return {
    entryPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    entryLabel: `¥${entryPrice}（回调 ${entryPct}%）`,
    stopLabel: `¥${stopLoss}（-${stopPct}%）`,
    tp1Label: `¥${takeProfit1}（+${tp1Pct}%）`,
    tp2Label: `¥${takeProfit2}（+${tp2Pct}%）`,
    riskRewardRatio
  }
}

function getRecommendation(score, stageType) {
  if (stageType === 'risk') return { level: '回避', color: '#b91c1c', text: '高风险，不建议追涨', emoji: '⛔' }
  if (score >= 85) return { level: '强烈推荐', color: '#f97316', text: '妖性突出，量价配合极佳', emoji: '🔥🔥' }
  if (score >= 72) return { level: '重点关注', color: '#eab308', text: '潜力妖股候选，择机布局', emoji: '⭐' }
  if (score >= 58) return { level: '适当关注', color: '#3b82f6', text: '具备一定妖性，等待催化', emoji: '👀' }
  return { level: '谨慎观望', color: '#6c7a91', text: '妖性不足或风险偏高', emoji: '🌀' }
}

function getLaunchTimeText(stageType) {
  const map = {
    pre: '📅 预计未来3-7个交易日内出现异动拉升，密切关注量能突变信号。',
    early: '⏰ 已进入启动窗口期，短期（1-3日）有望加速上行，建议设好移动止盈。',
    mid: '⌛ 处于主升中段，惯性冲高概率较大，警惕高位分歧板出现。',
    risk: '⚠️ 风险已显著加剧，不适合新开仓位，密切观察高位出货迹象。',
    cold: '❄️ 当前处于冷门低迷期，缺乏资金关注，短期内启动概率较低。需等待题材催化或资金入场信号。'
  }
  return map[stageType] || '⏳ 震荡整固中，启动时间需等待放量确认信号。'
}

function getStrategyText(stageType) {
  const map = {
    pre: '逢低潜伏，分批建仓介入，设置-5%止损线。等待放量突破确认后加仓，切忌追高。',
    early: '突破确认后可适当加仓，紧守5日均线作为止盈参考。目标上看第一目标位，到达后可部分止盈。',
    mid: '持仓者继续持有，移动止盈位逐步上移。新开仓需严格控制仓位（不超过总仓位10%），紧盯分时承接。',
    risk: '建议逐步止盈或回避，高位巨量阴线为明确离场信号。宁可错过，不可做错。',
    cold: '不建议参与，流动性差且缺乏催化。可加入自选股观察，等待放量异动后再考虑入场。'
  }
  return map[stageType] || '保持观望，等待更明确的入场信号。'
}

function getStrategyTips(stageType) {
  const map = {
    pre: {
      position: '1-2成试探仓',
      cycle: '3-7个交易日',
      rule: '-5%无条件止损',
      focus: '量能突变+放量突破',
      checklist: [
        '分2-3批建仓，首次不超过1成仓位',
        '放量突破关键阻力位方可加仓',
        '收盘跌破5日线减半仓',
        '单日跌幅超5%立即离场观望'
      ]
    },
    early: {
      position: '3-5成主攻仓',
      cycle: '2-5个交易日',
      rule: '以5日均线为止盈线',
      focus: '分时承接+连板概率',
      checklist: [
        '可适度加仓，总仓位不超过5成',
        '利润超10%后移动止损至成本价',
        '到达第一目标位先止盈1/3',
        '高位放量长上影为离场信号'
      ]
    },
    mid: {
      position: '持仓不动，新开≤1成',
      cycle: '1-3个交易日',
      rule: '移动止盈，回撤-7%离场',
      focus: '高位分歧+出货迹象',
      checklist: [
        '已持仓者逐步上移止盈位',
        '新开仓仅限超短，次日不涨停即走',
        '关注龙虎榜游资动向',
        '高位巨量长阴无条件清仓'
      ]
    },
    risk: {
      position: '不建议参与',
      cycle: '——',
      rule: '宁可错过，不可做错',
      focus: '高位出货+资金撤离',
      checklist: [
        '坚决不开新仓，观望为主',
        '持仓者逢反弹逐步减仓',
        '高位巨量阴线为明确离场信号',
        '等待回调企稳后再评估介入'
      ]
    },
    cold: {
      position: '不建议参与',
      cycle: '——',
      rule: '等待放量异动信号',
      focus: '题材催化+资金入场',
      checklist: [
        '加入自选股观察，不急于入场',
        '等待放量+涨幅双确认信号',
        '关注是否有热点题材催化',
        '若持续缩量阴跌则删除自选'
      ]
    }
  }
  return map[stageType] || {
    position: '观望',
    cycle: '待定',
    rule: '严格止损',
    focus: '量价配合',
    checklist: ['等待更明确的入场信号', '严格控制仓位', '设置好止损位', '不追高、不扛单']
  }
}

// ==================== 主控 ====================
async function loadDetail() {
  // 取消上一次未完成的请求
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  stockCode.value = route.query.code || ''
  stockName.value = route.query.name || ''
  if (!stockCode.value) {
    errorMsg.value = '未提供股票代码'
    return
  }
  loading.value = true
  errorMsg.value = ''

  try {
    const realtime = await fetchRealTime(stockCode.value)
    let klines = []
    try {
      klines = await fetchKline(stockCode.value, 100)
      // K线成功且足够则清除失败标记，否则标记"数据不足"（技术指标需至少20根）
      klineFailReason.value = klines && klines.length >= 20 ? '' : 'insufficient'
    } catch (e) {
      // 上游K线接口偶发慢响应/超时：记录失败原因，页面主体正常展示，技术指标面板显示兜底提示
      klineFailReason.value = 'failed'
      console.warn('[stockDetail] K线获取失败，技术指标暂不展示:', e?.message || e)
    }
    const factors = extractFactors(realtime, klines)
    const { total: score, marketScore, turnoverScore, volScore, gainScore, ampScore, volaBonus, consecutiveBonus, moneyBonus } = computeScores(factors)
    // 5日/10日涨幅使用接口值（与东财一致），K线值作为兜底
    const displayGain5d = realtime.gain5dBackend || factors.gain5d
    const displayGain10d = realtime.gain10dBackend || factors.gain10d

    const stageObj = getStage({ ...factors, gain5d: displayGain5d }, score)
    const target = getTargetPrice(factors.price, stageObj.type, score, displayGain5d)
    const rec = getRecommendation(score, stageObj.type)
    const launchText = getLaunchTimeText(stageObj.type)
    const strategyText = getStrategyText(stageObj.type)
    const strategyTips = getStrategyTips(stageObj.type)
    const entryStop = getEntryStopPrice(factors.price, stageObj.type, score, displayGain5d, factors.amplitude, factors.marketCap, factors.turnover, factors.ma20)

    // 描述文案
    const capDesc = factors.marketCap < 15 ? '极小盘，极易被游资撬动' : factors.marketCap < 30 ? '超小盘，弹性极强' : factors.marketCap < 60 ? '小盘优势明显，弹性极佳' : '中大盘股，妖性相对减弱'
    const volDesc = factors.volumeRatio > 3.0 ? '量比爆发式放大，攻击性极强' : factors.volumeRatio > 2.0 ? '量比显著放大，多头强势' : factors.volumeRatio > 1.3 ? '量能温和放大，多头占优' : '量能一般，需补量确认'
    const turnDesc = factors.turnover > 20 ? '交投极度活跃，游资接力激烈' : factors.turnover > 12 ? '交投非常活跃，资金参与度高' : factors.turnover > 8 ? '换手充分，市场参与度良好' : '活跃度有待进一步提升'
    const ampDesc = factors.amplitude > 10 ? '巨幅震荡，多空博弈白热化' : factors.amplitude > 6 ? '高振幅，资金分歧加大' : factors.amplitude > 4 ? '振幅健康，活跃度良好' : '振幅偏低，活跃度不足'
    const gainDesc = displayGain5d > 20 ? '强势突破，妖股雏形已现' : displayGain5d > 8 ? '温和上涨，蓄势待发' : displayGain5d > 3 ? '小幅上行，启动初期' : '短期动能偏弱，蓄势阶段'
    const gain10dDesc = displayGain10d > 30 ? '中期强势，趋势明确向上' : displayGain10d > 15 ? '中期向好，上升通道中' : displayGain10d > 5 ? '中期温和，稳步攀升' : '中期偏弱，有待放量'
    const themeDesc = factors.themeHeat > 75 ? '核心热点共振，极易爆发' : factors.themeHeat > 55 ? '题材有一定热度，需催化剂' : '题材关注度一般'

    // 涨跌停价（优先用腾讯接口的精确值，兜底按板块计算）
    // 科创板(sh68)、创业板(sz30) ±20%；北交所(bj8) ±30%；主板 ±10%
    const rawCode = stockCode.value.replace(/^(sh|sz|bj)/, '')
    const isKcb = stockCode.value.startsWith('sh68')
    const isCyb = stockCode.value.startsWith('sz30')
    const isBjs = stockCode.value.startsWith('bj8') || /^[48]/.test(rawCode)
    const limitRate = isKcb || isCyb ? 0.20 : isBjs ? 0.30 : 0.10
    const limitUp = realtime.limitUpPrice > 0 ? realtime.limitUpPrice : factors.price * (1 + limitRate)
    const limitDown = realtime.limitDownPrice > 0 ? realtime.limitDownPrice : factors.price * (1 - limitRate)
    const limitUpDist = ((limitUp - factors.price) / factors.price * 100)

    const targetUpside = ((parseFloat(target.high) - factors.price) / factors.price * 100)

    // ========== 技术指标计算 ==========
    let techIndicators = null
    if (klines?.length >= 20) {
      const closes = klines.map(k => k.close)
      const highs = klines.map(k => k.high)
      const lows = klines.map(k => k.low)
      const lastIdx = closes.length - 1

      // --- KDJ (9,3,3) ---
      const calcKDJ = (closeArr, highArr, lowArr, n = 9) => {
        const kArr = new Array(closeArr.length).fill(50)
        const dArr = new Array(closeArr.length).fill(50)
        const jArr = new Array(closeArr.length).fill(50)
        for (let i = n - 1; i < closeArr.length; i++) {
          let highestH = -Infinity, lowestL = Infinity
          for (let j = i - n + 1; j <= i; j++) {
            if (highArr[j] > highestH) highestH = highArr[j]
            if (lowArr[j] < lowestL) lowestL = lowArr[j]
          }
          const rsv = lowestL !== highestH ? ((closeArr[i] - lowestL) / (highestH - lowestL)) * 100 : 50
          kArr[i] = (2 / 3) * kArr[i - 1] + (1 / 3) * rsv
          dArr[i] = (2 / 3) * dArr[i - 1] + (1 / 3) * kArr[i]
          jArr[i] = 3 * kArr[i] - 2 * dArr[i]
        }
        return { kArr, dArr, jArr }
      }
      const { kArr, dArr, jArr } = calcKDJ(closes, highs, lows, 9)
      const k = +kArr[lastIdx].toFixed(1)
      const d = +dArr[lastIdx].toFixed(1)
      const j = +jArr[lastIdx].toFixed(1)

      // KDJ 信号
      let kdjCross = detectCross(kArr, dArr, lastIdx)
      let kdjSignal, kdjSignalClass
      if (j > 100) { kdjSignal = 'J值超买（>100），短期回调压力大'; kdjSignalClass = 'signal-warn' }
      else if (j < 0) { kdjSignal = 'J值超卖（<0），短期反弹概率大'; kdjSignalClass = 'signal-bull' }
      else if (k > 80 && d > 80) { kdjSignal = 'KD高位钝化，超买区域谨慎'; kdjSignalClass = 'signal-warn' }
      else if (k < 20 && d < 20) { kdjSignal = 'KD低位钝化，超卖区域关注'; kdjSignalClass = 'signal-bull' }
      else if (kdjCross === 'golden') { kdjSignal = '金叉 ▲ 看涨信号'; kdjSignalClass = 'signal-bull' }
      else if (kdjCross === 'dead') { kdjSignal = '死叉 ▼ 看跌信号'; kdjSignalClass = 'signal-bear' }
      else if (k > d) { kdjSignal = 'K在D上方，短期偏多'; kdjSignalClass = 'signal-neutral' }
      else { kdjSignal = 'K在D下方，短期偏空'; kdjSignalClass = 'signal-neutral' }

      // --- MACD (12,26,9) ---
      const { diff, dea } = calcMACD(closes, 12, 26, 9)
      const dif = +diff[lastIdx].toFixed(3)
      const deaVal = +dea[lastIdx].toFixed(3)
      const macdBar = +((dif - deaVal) * 2).toFixed(3)
      const macdCross = detectCross(diff, dea, lastIdx)

      // --- BOLL (20, 2) ---
      const recent20 = closes.slice(-20)
      const mean20 = recent20.reduce((a, b) => a + b, 0) / 20
      const std20 = Math.sqrt(recent20.reduce((s, v) => s + (v - mean20) ** 2, 0) / 20)
      const bollUpper = +(mean20 + 2 * std20).toFixed(2)
      const bollMid = +mean20.toFixed(2)
      const bollLower = +(mean20 - 2 * std20).toFixed(2)
      const bollWidth = bollMid > 0 ? ((bollUpper - bollLower) / bollMid * 100) : 0
      const bollPosition = bollUpper > bollLower ? ((closes[lastIdx] - bollLower) / (bollUpper - bollLower)) : 0.5
      let bollDesc
      if (bollPosition > 0.95) bollDesc = '触及上轨，超买压力区，短期有回调需求'
      else if (bollPosition > 0.7) bollDesc = '偏上轨运行，处于强势区'
      else if (bollPosition < 0.05) bollDesc = '触及下轨，超卖反弹区，短期有反弹需求'
      else if (bollPosition < 0.3) bollDesc = '偏下轨运行，处于弱势区'
      else bollDesc = '中轨附近，震荡格局'
      if (bollWidth < 5) bollDesc += '（带宽收窄，变盘临近）'
      else if (bollWidth > 20) bollDesc += '（带宽扩大，波动加剧）'

      // --- 支撑压力位（多层级） ---
      const price = factors.price
      const ma5 = closes.length >= 5 ? closes.slice(-5).reduce((a, b) => a + b, 0) / 5 : price
      const ma10 = closes.length >= 10 ? closes.slice(-10).reduce((a, b) => a + b, 0) / 10 : price
      const ma20Val = mean20
      const ma60 = closes.length >= 60 ? closes.slice(-60).reduce((a, b) => a + b, 0) / 60 : price
      const recent20h = highs.slice(-20)
      const recent20l = lows.slice(-20)
      const high20 = Math.max(...recent20h)
      const low20 = Math.min(...recent20l)
      const high60 = closes.length >= 60 ? Math.max(...highs.slice(-60)) : high20
      const low60 = closes.length >= 60 ? Math.min(...lows.slice(-60)) : low20

      // 多层级压力位（从近到远排序）
      const pressureLevels = []
      const addPressure = (name, val) => { if (val > price) pressureLevels.push({ name, val: +val.toFixed(2), dist: +((val - price) / price * 100).toFixed(1) }) }
      addPressure('BOLL上轨', bollUpper)
      addPressure('20日最高', high20)
      addPressure('60日最高', high60)
      addPressure('MA20', ma20Val)
      addPressure('MA60', ma60)
      const uniquePressures = []
      const seenVal = new Set()
      for (const p of pressureLevels.sort((a, b) => a.val - b.val)) {
        const key = p.val.toFixed(2)
        if (!seenVal.has(key)) { seenVal.add(key); uniquePressures.push(p) }
      }
      const nearestPressure = uniquePressures.length > 0 ? uniquePressures[0] : { name: '—', val: price, dist: 0 }

      // 多层级支撑位（从近到远排序）
      const supportLevels = []
      const addSupport = (name, val) => { if (val < price) supportLevels.push({ name, val: +val.toFixed(2), dist: +((price - val) / price * 100).toFixed(1) }) }
      addSupport('BOLL下轨', bollLower)
      addSupport('20日最低', low20)
      addSupport('60日最低', low60)
      addSupport('MA5', ma5)
      addSupport('MA10', ma10)
      addSupport('MA20', ma20Val)
      addSupport('MA60', ma60)
      const uniqueSupports = []
      const seenVal2 = new Set()
      for (const s of supportLevels.sort((a, b) => b.val - a.val)) {
        const key = s.val.toFixed(2)
        if (!seenVal2.has(key)) { seenVal2.add(key); uniqueSupports.push(s) }
      }
      const nearestSupport = uniqueSupports.length > 0 ? uniqueSupports[0] : { name: '—', val: price, dist: 0 }

      // --- 量价关系 ---
      const todayVol = klines[lastIdx].volume
      const avgVol5d = klines.length >= 5
        ? klines.slice(-5).reduce((s, k) => s + k.volume, 0) / 5
        : todayVol
      const avgVol5dWan = avgVol5d > 10000 ? (avgVol5d / 10000).toFixed(1) + '万手' : (avgVol5d / 100).toFixed(0) + '手'
      const todayVolWan = todayVol > 10000 ? (todayVol / 10000).toFixed(1) + '万手' : (todayVol / 100).toFixed(0) + '手'
      const volRatio5d = avgVol5d > 0 ? +(todayVol / avgVol5d).toFixed(2) : 1

      let volPriceDesc, volPriceClass
      const todayChange = klines[lastIdx].changePct || 0
      if (volRatio5d >= 1.5 && todayChange > 2) { volPriceDesc = '放量上涨，量价配合良好，多头强势'; volPriceClass = 'signal-bull' }
      else if (volRatio5d >= 1.5 && todayChange < -2) { volPriceDesc = '放量下跌，资金出逃信号，需警惕'; volPriceClass = 'signal-bear' }
      else if (volRatio5d >= 1.5) { volPriceDesc = '放量震荡，多空分歧加大'; volPriceClass = 'signal-warn' }
      else if (volRatio5d <= 0.6 && todayChange > 0) { volPriceDesc = '缩量上涨，上涨动力不足，注意回落'; volPriceClass = 'signal-warn' }
      else if (volRatio5d <= 0.6 && todayChange < 0) { volPriceDesc = '缩量下跌，抛压减弱，有望企稳'; volPriceClass = 'signal-bull' }
      else if (todayChange > 0) { volPriceDesc = '温和放量上涨，趋势健康'; volPriceClass = 'signal-bull' }
      else { volPriceDesc = '量价正常波动，无明显异常'; volPriceClass = 'signal-neutral' }

      // KDJ 颜色
      const getKdjColor = (val) => val > 80 ? '#f87171' : val < 20 ? '#4ade80' : '#eab308'

      techIndicators = {
        k, d, j,
        kColor: getKdjColor(k), dColor: getKdjColor(d), jColor: j > 100 ? '#f87171' : j < 0 ? '#4ade80' : '#eab308',
        kdjCross, kdjSignal, kdjSignalClass,
        dif, dea: deaVal, macdBar, macdCross,
        bollUpper, bollMid, bollLower, bollPosition, bollDesc,
        // 多层级支撑压力位
        pressureLevels: uniquePressures.slice(0, 3),
        supportLevels: uniqueSupports.slice(0, 3),
        nearestPressure, nearestSupport,
        // 兼容旧模板字段
        pressureLevel: nearestPressure.val,
        supportLevel: nearestSupport.val,
        pressureDist: nearestPressure.dist > 0 ? `+${nearestPressure.dist}%` : '—',
        supportDist: nearestSupport.dist > 0 ? `-${nearestSupport.dist}%` : '—',
        avgVol5d: avgVol5dWan, todayVol: todayVolWan, volRatio5d, volPriceDesc, volPriceClass
      }
    }

    result.value = {
      code: stockCode.value,
      name: realtime.name,
      price: realtime.price,
      changePct: realtime.changePct,
      open: realtime.open,
      high: realtime.high,
      low: realtime.low,
      yesterdayClose: realtime.yesterdayClose,
      amplitude: factors.amplitude,
      amountYi: realtime.amountWan / 10000,
      volumeWan: realtime.volumeHand / 10000,
      turnover: factors.turnover,
      volumeRatio: factors.volumeRatio,
      // 5日/10日涨幅优先用接口值（与东财一致），K线计算作为兜底
      gain5d: realtime.gain5dBackend || factors.gain5d,
      gain10d: realtime.gain10dBackend || factors.gain10d,
      // 涨幅类（接口直接值，更可靠）
      gain5dApi: realtime.gain5dBackend, gain10dApi: realtime.gain10dBackend, gain20dApi: realtime.gain20dBackend,
      gain60dApi: realtime.gain60dBackend,
      gainYtdApi: realtime.gainYtdBackend,
      // 市场状态
      marketStatusLabel: getMarketStatus().label,
      marketStatusType: getMarketStatus().type,
      // 52周高/低
      high52w: realtime.high52w,
      low52w: realtime.low52w,
      marketCap: factors.marketCap,
      totalMarketCap: realtime.totalMarketCapRaw,
      avgPrice: realtime.avgPrice,
      ma20: factors.ma20,
      themeHeat: factors.themeHeat,
      moneyFlow: factors.moneyFlow,
      moneyFlowAbs: (Math.abs(factors.moneyFlow) || 0).toFixed(1),
      moneyFlowPrefix: factors.moneyFlow > 0 ? '+' : factors.moneyFlow < 0 ? '-' : '',
      volatility20d: factors.volatility20d,
      consecutiveUpDays: factors.consecutiveUpDays,
      // 内外盘
      innerVolume: realtime.innerVolume,
      outerVolume: realtime.outerVolume,
      // 委比/委买
      committeeRatio: realtime.committeeRatio,
      committeeBuy: realtime.committeeBuy,
      // 估值
      peRatio: realtime.peRatio,
      pbRatio: realtime.pbRatio,
      // 股本
      totalShares: realtime.totalShares,
      floatShares: realtime.floatShares,
      score,
      marketScore, turnoverScore, volScore, gainScore, ampScore,
      volaBonus, consecutiveBonus, moneyBonus,
      stageName: stageObj.name,
      stageType: stageObj.type,
      stageDesc: stageObj.desc,
      targetLow: target.low,
      targetHigh: target.high,
      targetUpside,
      limitUp, limitDown, limitUpDist,
      recommendLevel: rec.level,
      recommendColor: rec.color,
      recommendEmoji: rec.emoji,
      recommendText: rec.text,
      launchText,
      strategyText,
      strategyTips,
      entryStop,
      capDesc, volDesc, turnDesc, ampDesc, gainDesc, gain10dDesc, themeDesc,
      techIndicators
    }

    // 加载完成后，检测是否有已存在的持仓记录
    const existingPos = calcPosition(stockCode.value, result.value.price)
    if (existingPos?.hasPosition) {
      positionData.value = existingPos
      updateStrategyForPosition(existingPos)
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('请求已取消')
      return
    }
    errorMsg.value = err.message || '获取数据失败'
  } finally {
    loading.value = false
  }
}

// 技术指标兜底：重新拉取K线（后端已加缓存+Referer+放宽超时，重试通常可恢复）
async function retryKline() {
  if (!stockCode.value || klineRetrying.value) return
  klineRetrying.value = true
  klineFailReason.value = ''
  try {
    await loadDetail()
  } catch (e) {
    klineFailReason.value = 'failed'
    console.warn('[stockDetail] 技术指标重试失败:', e?.message || e)
  } finally {
    klineRetrying.value = false
  }
}

// 持仓数据变更回调
function onPositionChange(pos) {
  positionData.value = pos
  // 有持仓时重新计算策略（使用成本价而非当前价）
  if (result.value && pos?.hasPosition) {
    updateStrategyForPosition(pos)
  }
}

// 基于持仓重新计算策略建议
function updateStrategyForPosition(pos) {
  if (!result.value || !pos || !pos.hasPosition) return
  const r = result.value
  const costPrice = pos.avgCost
  const currentPrice = r.price

  // 当前浮盈百分比
  const floatPnlPct = ((currentPrice - costPrice) / costPrice * 100)

  // ========== 止损止盈：复用无持仓时的动态比例，仅以成本价替换"建议介入价" ==========
  // 重新计算阶段因子（使用 r 中已有的数据）
  const stageType = r.stageType
  const score = r.score

  // 根据当前市况动态确定止损/止盈比例
  // 基准比例：按阶段类型
  let baseStopRatio, baseTP1Ratio, baseTP2Ratio
  if (stageType === 'early') {
    baseStopRatio = 0.04; baseTP1Ratio = 0.15; baseTP2Ratio = 0.28
  } else if (stageType === 'mid') {
    baseStopRatio = 0.05; baseTP1Ratio = 0.18; baseTP2Ratio = 0.32
  } else if (stageType === 'risk') {
    baseStopRatio = 0.03; baseTP1Ratio = 0.08; baseTP2Ratio = 0.15
  } else if (stageType === 'cold') {
    baseStopRatio = 0.04; baseTP1Ratio = 0.10; baseTP2Ratio = 0.18
  } else { // pre / 震荡试盘
    baseStopRatio = 0.045; baseTP1Ratio = 0.12; baseTP2Ratio = 0.22
  }

  // 评分调节：评分越高 → 止损可略宽（信任模型判断），止盈可略高
  const scoreFactor = 0.8 + (score / 100) * 0.5  // 0.8 ~ 1.3
  const adjustedStopRatio = Math.min(baseStopRatio * scoreFactor, 0.08)
  const adjustedTP1Ratio = Math.min(baseTP1Ratio * scoreFactor, 0.30)
  const adjustedTP2Ratio = Math.min(baseTP2Ratio * scoreFactor, 0.50)

  // 浮盈保护：盈利超过止损比例的2倍时，上移止损至成本价
  let effectiveStopRatio = adjustedStopRatio
  if (floatPnlPct >= adjustedStopRatio * 2) {
    effectiveStopRatio = 0  // 止损移至成本价
  } else if (floatPnlPct > adjustedStopRatio) {
    effectiveStopRatio = adjustedStopRatio - floatPnlPct * 0.5  // 部分上移
  }

  const stopLoss = +(costPrice * (1 - effectiveStopRatio)).toFixed(2)
  const takeProfit1 = +(costPrice * (1 + adjustedTP1Ratio)).toFixed(2)
  const takeProfit2 = +(costPrice * (1 + adjustedTP2Ratio)).toFixed(2)

  // 盈亏比
  const riskPerShare = costPrice - stopLoss
  const rewardPerShare = takeProfit2 - costPrice
  const riskRewardRatio = riskPerShare > 0 ? +(rewardPerShare / riskPerShare).toFixed(1) : (effectiveStopRatio === 0 ? null : null)

  // 覆盖 entryStop（标题改为持仓视角）
  r.entryStop = {
    entryPrice: costPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    entryLabel: `¥${costPrice.toFixed(3)}（成本价）`,
    stopLabel: effectiveStopRatio > 0 ? `¥${stopLoss}（-${(effectiveStopRatio * 100).toFixed(1)}%）` : `¥${costPrice.toFixed(3)}（已保本）`,
    tp1Label: `¥${takeProfit1}（+${(adjustedTP1Ratio * 100).toFixed(1)}%）`,
    tp2Label: `¥${takeProfit2}（+${(adjustedTP2Ratio * 100).toFixed(1)}%）`,
    riskRewardRatio: effectiveStopRatio > 0 ? riskRewardRatio : null
  }

  // ========== 策略文字：结合浮盈 + 阶段联动 ==========
  const stopDesc = effectiveStopRatio > 0 ? `止损 ¥${stopLoss}` : `止损已上移至成本价 ¥${costPrice.toFixed(3)}`
  const stageLabel = stageType === 'risk' ? '（⚠️ 高风险区，谨慎持有）' : stageType === 'early' ? '（✅ 主升初期，把握机会）' : stageType === 'mid' ? '（🔥 主升浪中，密切跟踪）' : ''

  if (floatPnlPct > 15) {
    r.strategyText = `当前浮盈 ${floatPnlPct.toFixed(1)}%，盈利丰厚${stageLabel}。${effectiveStopRatio === 0 ? '止损已保本，可安心持有让利润奔跑。' : '建议移动止损至成本价锁定利润。'}`
  } else if (floatPnlPct > 5) {
    r.strategyText = `当前浮盈 ${floatPnlPct.toFixed(1)}%，盈利良好${stageLabel}。${stopDesc}，持仓观望，若冲高可部分止盈锁定收益。`
  } else if (floatPnlPct > 0) {
    r.strategyText = `当前微盈 ${floatPnlPct.toFixed(1)}%${stageLabel}。成本 ¥${costPrice.toFixed(3)}，${stopDesc}。耐心持有，严格纪律。`
  } else if (floatPnlPct > -5) {
    r.strategyText = `当前浮亏 ${Math.abs(floatPnlPct).toFixed(1)}%，轻微亏损${stageLabel}。${stopDesc}，未跌破前继续持有，关注量能变化。`
  } else {
    r.strategyText = `当前浮亏 ${Math.abs(floatPnlPct).toFixed(1)}%，亏损较大${stageLabel}。${stopDesc}，若跌破必须果断离场，不要扛单。`
  }

  // ========== 更新策略卡片 ==========
  const positionDesc = `持仓 ${pos.totalShares} 股，均价 ¥${costPrice.toFixed(3)}`
  r.strategyTips = {
    position: positionDesc,
    cycle: r.strategyTips?.cycle || '待定',
    rule: effectiveStopRatio > 0 ? `止损 ¥${stopLoss}（-${(effectiveStopRatio * 100).toFixed(1)}%）` : '保本持有',
    focus: stageType === 'risk' ? '高位分歧+出货信号' : stageType === 'mid' ? '分时承接+连板动能' : '量价配合',
    checklist: [
      `成本价 ¥${costPrice.toFixed(3)}，当前 ${floatPnlPct >= 0 ? '+' : ''}${floatPnlPct.toFixed(1)}%`,
      effectiveStopRatio > 0 ? `止损线 ¥${stopLoss}，跌破无条件离场` : `止损已保本，专注止盈`,
      `止盈一 ¥${takeProfit1}（+${(adjustedTP1Ratio * 100).toFixed(1)}%），到达可减仓1/3`,
      `止盈二 ¥${takeProfit2}（+${(adjustedTP2Ratio * 100).toFixed(1)}%），到达可清仓`
    ]
  }
}

const stageTagClass = computed(() => {
  if (!result.value) return ''
  const t = result.value.stageType
  return t === 'early' ? 'tag-early' : t === 'mid' ? 'tag-mid' : t === 'risk' ? 'tag-risk' : 'tag-pre'
})
const stageTagType = computed(() => {
  if (!result.value) return 'info'
  const t = result.value.stageType
  return t === 'early' ? 'success' : t === 'mid' ? 'warning' : t === 'risk' ? 'danger' : 'info'
})

onMounted(() => {
  // 滚动到页面顶部（解决从筛选列表跳转时继承滚动位置的问题）
  window.scrollTo({ top: 0, behavior: 'instant' })

  // 如果有路由参数（从筛选列表跳转），自动加载；否则显示搜索框等待用户输入
  const codeFromQuery = route.query.code
  if (codeFromQuery) {
    stockCode.value = codeFromQuery
    stockName.value = route.query.name || ''
    loadDetail()
  }
})

// Hero 持仓区金额格式化（与 PositionManager 一致）
function formatHeroMoney(v) {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(2) + '万'
  return Math.abs(v).toFixed(2)
}

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
})
</script>

<style lang="scss" scoped src="./stockDetail.scss"></style>

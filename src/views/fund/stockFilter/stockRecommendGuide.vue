<template>
  <div class="guide-page">
    <div class="guide-toolbar">
      <button class="back-btn" @click="goBack">← 返回</button>
      <div class="guide-title">普通股票测评 · 评分说明</div>
      <div class="guide-update">最后更新：2026-06</div>
    </div>

    <section class="card">
      <h3 class="card-title">一、模型总览</h3>
      <p class="desc">
        本工具对全市场 A 股进行「六维」多因子评分：<b>估值 / 成长性 / 盈利质量 / 技术面 / 资金情绪 / 风险</b>。
        每个维度由若干子指标加权聚合，六个维度再按投资周期权重加权得到 0~100 的综合评分。
        评分基于实时行情 + 最新财报（F10）动态计算，5 分钟缓存，可切换「短线 / 中长线 / 长线」三种视角。
      </p>
      <div class="flow">
        <div class="flow-item">① 全市场快照<br /><small>约 5500 只</small></div>
        <div class="flow-arrow">→</div>
        <div class="flow-item">② 快筛过滤<br /><small>行业/市值/PE/PB/股息/换手</small></div>
        <div class="flow-arrow">→</div>
        <div class="flow-item">③ 基础分排序<br /><small>按周期取 Top 300 池</small></div>
        <div class="flow-arrow">→</div>
        <div class="flow-item">④ 补财务+K线<br /><small>F10 / 腾讯行情</small></div>
        <div class="flow-arrow">→</div>
        <div class="flow-item">⑤ 六维评分<br /><small>分位/阈值/条件组合</small></div>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">二、周期权重表</h3>
      <p class="desc">不同投资周期的六大维度权重不同：短线重「技术面 + 资金情绪」，中长线重「成长 + 盈利质量」，长线重「估值 + 盈利质量」。</p>
      <div class="table-wrap">
        <table class="guide-table">
          <thead>
            <tr>
              <th>周期</th><th>估值</th><th>成长性</th><th>盈利质量</th><th>技术面</th><th>资金情绪</th><th>风险</th><th>RSI周期</th><th>侧重说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in horizons" :key="h.key">
              <td><span class="h-tag" :class="h.key">{{ h.label }}</span></td>
              <td>{{ h.weights.valuation }}%</td>
              <td>{{ h.weights.growth }}%</td>
              <td>{{ h.weights.quality }}%</td>
              <td class="hl">{{ h.weights.technical }}%</td>
              <td class="hl">{{ h.weights.sentiment }}%</td>
              <td>{{ h.weights.risk }}%</td>
              <td>{{ h.rsiPeriod }}</td>
              <td class="desc-cell">{{ h.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">* 若某维度数据全部缺失，其权重会自动按比例分摊到其余维度，保证总分口径一致。</p>
    </section>

    <section class="card">
      <h3 class="card-title">三、六大维度与子指标</h3>
      <div class="dim-grid">
        <div v-for="d in dims" :key="d.key" class="dim-card" :class="'d-' + d.key">
          <div class="dim-head">
            <span class="dim-icon">{{ d.icon }}</span>
            <span class="dim-name">{{ d.name }}</span>
            <span class="dim-tag">{{ d.tag }}</span>
          </div>
          <ul class="dim-items">
            <li v-for="(it, i) in d.items" :key="i">{{ it }}</li>
          </ul>
          <div class="dim-method">打分方式：{{ d.method }}</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">四、技术面子类权重（随周期变化）</h3>
      <div class="table-wrap">
        <table class="guide-table">
          <thead>
            <tr><th>子类</th><th>包含指标</th><th>短线</th><th>中长线</th><th>长线</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in techSubs" :key="t.key">
              <td>{{ t.name }}</td>
              <td class="desc-cell">{{ t.items }}</td>
              <td>{{ t.short }}%</td>
              <td>{{ t.mid }}%</td>
              <td>{{ t.long }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">五、打分方法</h3>
      <div class="method-grid">
        <div class="method-card">
          <div class="m-icon">📐</div>
          <div class="m-name">分位数法（横截面）</div>
          <p class="m-desc">在评分池内计算某指标从低到高的排名分位（0~100）。正向指标（如 ROE、增速）分位越高得分越高；反向指标（如 PE、波动率）取 100 - 分位。适合跨股票横向比较。</p>
        </div>
        <div class="method-card">
          <div class="m-icon">🎯</div>
          <div class="m-name">固定阈值法</div>
          <p class="m-desc">按预设区间给分。例如 PEG：0~0.8 给 90 分，0.8~1.5 给 70 分；资产负债率：&lt;50% 给 85 分，&gt;100% 给 10 分。适合有明确业务含义的指标。</p>
        </div>
        <div class="method-card">
          <div class="m-icon">🧩</div>
          <div class="m-name">条件组合法</div>
          <p class="m-desc">多个条件组合判定。如均线多头排列（MA5&gt;MA10&gt;MA20）、MACD 金叉、突破 20 日高点且放量、OBV 价量齐升等，按形态强弱给分。</p>
        </div>
      </div>
    </section>

    <section class="card">
      <h3 class="card-title">六、风险否决项与结论映射</h3>
      <div class="two-col">
        <div class="veto-box">
          <div class="veto-title">🚫 触发任一条件，综合评分强制 ≤ 40 分，结论强制「回避」：</div>
          <ul>
            <li>ST / 退市整理</li>
            <li>资产负债率 &gt; 100%</li>
            <li>商誉占净资产 &gt; 50%</li>
            <li>连续两年亏损且营收 &lt; 1 亿</li>
          </ul>
        </div>
        <div class="conclude-box">
          <div class="veto-title">🎖️ 结论映射（综合分 → 推荐结论）：</div>
          <div class="conclude-list">
            <div class="c-row"><span class="c-tag cc-hot">重点关注</span><span class="c-range">≥ 85 且风险低</span></div>
            <div class="c-row"><span class="c-tag cc-buy">可关注</span><span class="c-range">≥ 75（风险非高）/ ≥ 85 风险高</span></div>
            <div class="c-row"><span class="c-tag cc-mid">中性</span><span class="c-range">60 ~ 74</span></div>
            <div class="c-row"><span class="c-tag cc-warn">谨慎</span><span class="c-range">40 ~ 59</span></div>
            <div class="c-row"><span class="c-tag cc-avoid">回避</span><span class="c-range">&lt; 40 或触发否决</span></div>
          </div>
          <div class="c-note">星级：90+ 五星 / 80+ 四星 / 70+ 三星 / 60+ 二星 / 其余一星</div>
          <div class="c-note">颜色：综合评分 ≥80 绿、60~79 黄、&lt;60 红</div>
        </div>
      </div>
    </section>

    <div class="disclaimer">
      ⚠️ 本工具为多因子量化评分研究工具，评分基于历史数据与公开接口计算，不构成任何投资建议。数据可能存在延迟、缺失或错误，请以交易所及上市公司公告为准。股市有风险，投资需谨慎。
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const horizons = [
  { key: 'short', label: '短线', rsiPeriod: 6, weights: { valuation: 5, growth: 10, quality: 10, technical: 35, sentiment: 30, risk: 10 }, desc: '技术面35% + 资金情绪30%，侧重量价与短线动量' },
  { key: 'mid', label: '中长线', rsiPeriod: 14, weights: { valuation: 15, growth: 25, quality: 25, technical: 20, sentiment: 10, risk: 5 }, desc: '成长与盈利质量各25%，兼顾估值与技术' },
  { key: 'long', label: '长线', rsiPeriod: 24, weights: { valuation: 30, growth: 20, quality: 30, technical: 10, sentiment: 5, risk: 5 }, desc: '估值+盈利质量合计60%，弱化短期波动' }
]

const dims = [
  {
    key: 'valuation', icon: '💎', name: '估值', tag: '便宜才是硬道理',
    items: ['PE(TTM) 横截面分位（反向）', 'PB 横截面分位（反向）', '股息率（正向分位）', 'PEG = PE / 利润增速（阈值）'],
    method: '分位数 + 阈值'
  },
  {
    key: 'growth', icon: '🚀', name: '成长性', tag: '业绩加速',
    items: ['单季营收同比（分位）', '单季净利同比（分位）', '营收累计同比（分位）', '净利累计同比（分位）', 'ROE 连续上升季度数（阈值）'],
    method: '分位数 + 阈值'
  },
  {
    key: 'quality', icon: '🛡️', name: '盈利质量', tag: '赚钱的含金量',
    items: ['ROE 净资产收益率（阈值+分位）', '毛利率（分位）', '净利率（分位）', '经营现金流 / 净利润（阈值）', '商誉 / 净资产（阈值，反向）'],
    method: '分位数 + 阈值'
  },
  {
    key: 'technical', icon: '📈', name: '技术面', tag: '趋势与动量',
    items: ['均线多头排列 MA5/10/20/60（条件）', '价格站上均线比例', 'MACD 金叉/柱状增长（条件）', '1/3/12 月动量（分位）', 'RSI（周期自适应，阈值）', 'KDJ(9,3,3)（金叉/死叉/超买超卖，条件）', '夏普比率（分位）', '波动率/布林带/回撤/振幅', '量比/OBV/换手率/量能异动', '突破 20 日高点形态'],
    method: '条件 + 分位 + 阈值（子类加权）'
  },
  {
    key: 'sentiment', icon: '🔥', name: '资金情绪', tag: '资金的态度',
    items: ['5日涨跌幅（分位，过热封顶）', '年初至今涨跌幅（分位，过热封顶）', '融资余额 5 日变化（阈值）', '机构调研热度 30 天（阈值）', '龙虎榜 5 日（净买/净卖）', '量比·资金活跃度（阈值）'],
    method: '分位数 + 阈值'
  },
  {
    key: 'risk', icon: '⚠️', name: '风险', tag: '先防雷',
    items: ['ST / 退市标记（否决）', '资产负债率（阈值，反向）', '商誉占比（阈值，反向）', '股价历史波动率（分位，反向）', '最大回撤（分位，反向）', '连续亏损 + 小营收（否决）'],
    method: '阈值 + 分位 + 否决'
  }
]

const techSubs = [
  { key: 'trend', name: '趋势类', items: '均线排列、站上均线比例、MA60 支撑', short: 30, mid: 35, long: 40 },
  { key: 'momentum', name: '动量类', items: 'RSI、KDJ、1/3 月动量、MACD', short: 30, mid: 25, long: 20 },
  { key: 'volatility', name: '波动类', items: '年化波动率、夏普比率、布林带位置、振幅', short: 15, mid: 15, long: 15 },
  { key: 'volume', name: '量能类', items: '量比、换手率、OBV、量能异动', short: 15, mid: 15, long: 15 },
  { key: 'pattern', name: '形态类', items: '突破 20 日高点、12 月动量、回撤位置', short: 10, mid: 10, long: 10 }
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ path: '/fund/stock-filter' })
}
</script>

<style scoped>
.guide-page { display: flex; flex-direction: column; gap: 14px; }
.guide-toolbar {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
  background: #fff; border-radius: 14px; padding: 12px 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.back-btn {
  border: 1.5px solid #dde5ec; background: #f8fafc; color: #475569;
  padding: 8px 16px; border-radius: 10px; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.back-btn:hover { border-color: #f59e0b; color: #f59e0b; }
.guide-title { font-size: 0.9rem; font-weight: 800; color: #1f2937; }
.guide-update { margin-left: auto; font-size: 0.68rem; color: #94a3b8; }
.card {
  background: #fff; border-radius: 14px; padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.card-title { font-size: 0.82rem; font-weight: 700; color: #1f2937; margin: 0 0 10px; }
.desc { font-size: 0.74rem; color: #475569; line-height: 1.8; margin: 0 0 12px; }
.desc b { color: #b45309; }
.flow {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  background: #f8fafc; border: 1px solid #eef2f7; border-radius: 10px; padding: 12px;
}
.flow-item { font-size: 0.7rem; font-weight: 700; color: #334155; text-align: center; }
.flow-item small { display: block; font-weight: 400; color: #94a3b8; font-size: 0.62rem; margin-top: 2px; }
.flow-arrow { color: #f59e0b; font-weight: 800; }
.table-wrap { overflow-x: auto; }
.guide-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
.guide-table th {
  background: #f8fafc; color: #64748b; font-weight: 700;
  padding: 8px; border-bottom: 1.5px solid #e2e8f0; text-align: left; white-space: nowrap;
}
.guide-table td { padding: 8px; border-bottom: 1px solid #f0f4f8; color: #334155; }
.hl { color: #b45309; font-weight: 800; }
.desc-cell { color: #64748b; font-size: 0.66rem; line-height: 1.5; }
.h-tag {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 0.66rem; font-weight: 800; white-space: nowrap;
}
.h-tag.short { background: #fef2f2; color: #dc2626; }
.h-tag.mid { background: #fffbeb; color: #b45309; }
.h-tag.long { background: #fffbeb; color: #d97706; }
.note { font-size: 0.64rem; color: #94a3b8; margin: 8px 0 0; }
.dim-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.dim-card {
  border: 1px solid #eef2f7; border-radius: 12px; padding: 12px;
  border-top: 3px solid #f59e0b;
}
.dim-card.d-valuation { border-top-color: #06b6d4; }
.dim-card.d-growth { border-top-color: #f59e0b; }
.dim-card.d-quality { border-top-color: #22c55e; }
.dim-card.d-technical { border-top-color: #a855f7; }
.dim-card.d-sentiment { border-top-color: #fb7185; }
.dim-card.d-risk { border-top-color: #64748b; }
.dim-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.dim-icon { font-size: 1rem; }
.dim-name { font-size: 0.78rem; font-weight: 800; color: #1f2937; }
.dim-tag { margin-left: auto; font-size: 0.6rem; color: #94a3b8; white-space: nowrap; }
.dim-items { margin: 0 0 8px; padding-left: 16px; }
.dim-items li { font-size: 0.68rem; color: #475569; line-height: 1.7; }
.dim-method {
  font-size: 0.62rem; color: #b45309; background: #fffbeb;
  padding: 4px 8px; border-radius: 6px; display: inline-block;
}
.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.method-card {
  background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px;
}
.m-icon { font-size: 1.3rem; margin-bottom: 6px; }
.m-name { font-size: 0.75rem; font-weight: 800; color: #1f2937; margin-bottom: 6px; }
.m-desc { font-size: 0.68rem; color: #64748b; line-height: 1.7; margin: 0; }
.two-col { display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px; }
.veto-box, .conclude-box {
  border-radius: 12px; padding: 12px 14px;
}
.veto-box { background: #fef2f2; border: 1px solid #fecaca; }
.veto-title { font-size: 0.72rem; font-weight: 800; color: #dc2626; margin-bottom: 8px; line-height: 1.5; }
.veto-box ul { margin: 0; padding-left: 18px; }
.veto-box li { font-size: 0.68rem; color: #b91c1c; line-height: 1.8; }
.conclude-box { background: #fef3c7; border: 1px solid #fde68a; }
.conclude-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.c-row { display: flex; align-items: center; gap: 10px; }
.c-tag {
  display: inline-block; padding: 2px 12px; border-radius: 12px;
  font-size: 0.66rem; font-weight: 800; min-width: 64px; text-align: center; white-space: nowrap;
}
.cc-hot { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.cc-buy { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.cc-mid { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.cc-warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
.cc-avoid { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.c-range { font-size: 0.68rem; color: #475569; font-family: Consolas, monospace; }
.c-note { font-size: 0.64rem; color: #64748b; line-height: 1.7; }
.disclaimer {
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;
  padding: 12px 16px; font-size: 0.68rem; color: #92400e; line-height: 1.7; text-align: center;
}
@media (max-width: 1100px) {
  .dim-grid, .method-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 800px) {
  .dim-grid, .method-grid, .two-col { grid-template-columns: 1fr; }
}
/* 注意：scoped 中必须平铺写 html.dark-mode .xxx，不能用 :global() 包裹后再嵌套 */
html.dark-mode .guide-page {
  .guide-toolbar, .card { background: #15161e; border: 1px solid #252733; box-shadow: none; }
  .back-btn { background: #1e2030; border-color: #2d3142; color: #8b93a7; }
  .back-btn:hover { border-color: #f59e0b; color: #f59e0b; }
  .guide-title, .card-title { color: #e2e8f0; }
  .guide-update { color: #4a5166; }
  .desc { color: #8b93a7; }
  .flow { background: #1a1b26; border-color: #252733; }
  .flow-item { color: #cbd5e1; }
  .flow-item small { color: #4a5166; }
  .guide-table th { background: #1a1b26; color: #8b93a7; border-bottom-color: #2d3142; }
  .guide-table td { border-bottom-color: #22232f; color: #cbd5e1; }
  .desc-cell { color: #8b93a7; }
  .dim-card { border-color: #252733; }
  .dim-name, .m-name { color: #e2e8f0; }
  .dim-items li { color: #8b93a7; }
  .dim-method { background: #2a1f0a; color: #fbbf24; }
  .method-card { background: #1a1b26; border-color: #252733; }
  .m-desc { color: #8b93a7; }
  .veto-box { background: #2a1515; border-color: #4a1f1f; }
  .veto-title, .veto-box li { color: #f87171; }
  .conclude-box { background: #2a1f0a; border-color: #4a3410; }
  .cc-mid { background: #1e2030; color: #94a3b8; border-color: #2d3142; }
  .cc-avoid { background: #1e2030; color: #8b93a7; border-color: #2d3142; }
  .c-range, .c-note { color: #8b93a7; }
  .disclaimer { background: #1e1a0e; border-color: #3a3217; color: #d4a74e; }
}
</style>

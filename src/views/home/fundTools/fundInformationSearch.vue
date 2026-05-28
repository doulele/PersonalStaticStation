<template>
  <div class="fund-drawdown">
    <el-card shadow="hover" class="query-card">
      <div class="header">
        <h2>📊 基金历史回撤 & 今日实时涨跌幅</h2>
        <p class="description">
          输入6位基金代码，多个用逗号、空格或换行分隔；
          <span class="tip">（实时估值来自天天基金，非交易时段可能无数据）</span>
        </p>

        <div class="common-codes">
          <span class="label">常用基金代码：</span>
          <el-tooltip
            v-for="code in commonCodes"
            :key="code"
            :content="getFundName(code)"
            placement="top"
            :show-after="300"
          >
            <el-tag
              :type="isCodeSelected(code) ? 'primary' : 'info'"
              :effect="isCodeSelected(code) ? 'dark' : 'plain'"
              class="code-tag"
              @click="toggleCode(code)"
            >
              {{ code }}
            </el-tag>
          </el-tooltip>
        </div>
      </div>

      <el-input
        v-model="inputCodes"
        type="textarea"
        :rows="3"
        placeholder="输入基金代码，如：007811,008186,012454"
        clearable
        class="code-input"
      />

      <div class="action-bar">
        <div class="action-bar-left">
          <span class="drawdown-date-label">区间回撤起点：</span>
          <el-date-picker
            v-model="drawdownDate"
            type="date"
            placeholder="选择区间回撤起点"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="large"
            class="drawdown-date-picker"
          />
        </div>
        <el-button type="primary" size="large" :loading="loading" @click="handleQuery">
          开始查询
        </el-button>
      </div>
      <div v-if="statusText" class="status-bar">
        <span class="status-text">{{ statusText }}</span>
      </div>

      <div v-if="errors.length" class="error-area">
        <el-alert title="以下基金查询失败" type="error" :closable="false" show-icon>
          <ul>
            <li v-for="e in errors" :key="e.code">{{ e.code }}：{{ e.message }}</li>
          </ul>
        </el-alert>
      </div>
    </el-card>

    <el-card v-if="fundList.length" shadow="hover" class="table-card desktop-only">
      <el-table
        :data="fundList"
        border
        stripe
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
        style="width: 100%"
      >
        <el-table-column prop="code" label="基金代码" width="100" />
        <el-table-column prop="name" label="基金名称" min-width="160" />
        <el-table-column prop="todayChange" label="今日涨跌幅" width="130">
          <template #default="{ row }">
            <span v-if="row.todayChange !== '—'" :class="getChangeClass(row.todayChange)">
              {{ row.todayChange }}
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="maxValue" label="最高净值" width="110" />
        <el-table-column prop="maxDate" label="最高净值日期" width="120" />
        <el-table-column prop="curValue" label="最新净值" width="110" />
        <el-table-column prop="curDate" label="最新日期" width="120" />
        <el-table-column prop="drawdown" label="历史最大回撤" width="120">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown)">{{ row.drawdown }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="rangeMaxDrawdown" label="区间最大回撤" width="140">
          <template #default="{ row }">
            <span v-if="row.rangeMaxDrawdown !== '—'" :class="getChangeClass(row.rangeMaxDrawdown)">
              {{ row.rangeMaxDrawdown }}%
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="curDrawdown" label="区间当前回撤" width="130">
          <template #default="{ row }">
            <span v-if="row.curDrawdown !== '—'" :class="getChangeClass(row.curDrawdown)">
              {{ row.curDrawdown }}%
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="dwjz" label="昨日净值" width="110" />
        <el-table-column prop="gsz" label="实时估值" width="110" />
        <el-table-column label="估值时间" width="110">
          <template #default="{ row }">
            <span v-if="row.gztime !== '—'" class="gztime-split">
              <span>{{ splitGztime(row.gztime).date }}</span>
              <span>{{ splitGztime(row.gztime).time }}</span>
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- 移动端数据展示卡片 -->
    <div v-if="fundList.length" class="card-list mobile-only">
      <el-card
        v-for="fund in fundList"
        :key="fund.code"
        shadow="hover"
        class="fund-card"
      >
        <div class="card-header">
          <el-tag effect="plain" type="info" size="large" class="card-code">{{ fund.code }}</el-tag>
          <span class="card-name">{{ fund.name }}</span>
        </div>

        <div class="card-body">
          <div class="data-row">
            <div class="data-item highlight">
              <div class="data-label">今日涨跌幅</div>
              <div class="data-value">
                <span v-if="fund.todayChange !== '—'" :class="getChangeClass(fund.todayChange)">
                  {{ fund.todayChange }}
                </span>
                <span v-else class="no-data">—</span>
              </div>
            </div>
            <div class="data-item highlight">
              <div class="data-label">历史最大回撤</div>
              <div class="data-value">
                <span :class="getChangeClass(fund.drawdown)">{{ fund.drawdown }}%</span>
              </div>
            </div>
          </div>

          <div class="data-row">
            <div class="data-item highlight">
              <div class="data-label">区间当前回撤</div>
              <div class="data-value">
                <span v-if="fund.curDrawdown !== '—'" :class="getChangeClass(fund.curDrawdown)">
                  {{ fund.curDrawdown }}%
                </span>
                <span v-else class="no-data">—</span>
              </div>
            </div>
            <div class="data-item highlight">
              <div class="data-label">区间最大回撤</div>
              <div class="data-value">
                <span v-if="fund.rangeMaxDrawdown !== '—'" :class="getChangeClass(fund.rangeMaxDrawdown)">
                  {{ fund.rangeMaxDrawdown }}%
                </span>
                <span v-else class="no-data">—</span>
              </div>
            </div>
          </div>

          <div class="data-row">
            <div class="data-item">
              <div class="data-label">最新净值</div>
              <div class="data-value">{{ fund.curValue }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">最新日期</div>
              <div class="data-value">{{ fund.curDate }}</div>
            </div>
          </div>

          <div class="data-row">
            <div class="data-item">
              <div class="data-label">最高净值</div>
              <div class="data-value">{{ fund.maxValue }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">最高净值日期</div>
              <div class="data-value">{{ fund.maxDate }}</div>
            </div>
          </div>

          <div class="data-row three-col">
            <div class="data-item">
              <div class="data-label">昨日净值</div>
              <div class="data-value">{{ fund.dwjz }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">实时估值</div>
              <div class="data-value">{{ fund.gsz }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">估值时间</div>
              <div class="data-value">
                <span v-if="fund.gztime !== '—'" class="gztime-split">
                  <span>{{ splitGztime(fund.gztime).date }}</span>
                  <span>{{ splitGztime(fund.gztime).time }}</span>
                </span>
                <span v-else>—</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {formatDate} from '@/utils/common/date'

/** 状态：查询结果列表 */
const fundList = ref([]);
/** 状态：查询失败列表 */
const errors = ref([]);
/** 状态：加载中标志 */
const loading = ref(false);
/** 状态：加载提示文本 */
const statusText = ref('');
/** 状态：区间当前回撤筛选起始日期，默认2024-01-01 */
const drawdownDate = ref('2024-01-01');

/** 常用基金代码 → 名称映射表 */
const FUND_NAME_MAP = {
  '008186': '淳厚信睿混合A', '012454': '淳厚鑫悦混合A', '017498': '淳厚添益债券A',
  '011370': '华商均衡成长混合C', '690002': '民生增强收益债券A', '006030': '南方昌元可转债债券A',
  '110020': '易方达沪深300ETF联接A', '022453': '嘉实中证A500ETF联接A',
  '005763': '中欧电子信息产业沪港深股票C', '720001': '财通价值动量混合A',
  '013402': '华夏恒生科技ETF发起式联接(QDII)A', '040046': '华安纳斯达克100ETF联接(QDII)A',
  '050025': '博时标普500ETF联接A', '100032': '富国中证红利指数增强A',
  '006327': '易方达中证海外互联网50ETF联接(QDII)A', '003624': '创金合信资源股票发起式A',
  '160213': '国泰纳斯达克100指数(QDII)', '161005': '富国天惠成长混合(LOF)A',
  '164906': '交银中证海外中国互联网指数(LOF)A'
};
let fundCodeList = Object.keys(FUND_NAME_MAP);
const commonCodes = fundCodeList;
const inputCodes = ref(fundCodeList.join(','));

/** 峰值-谷值法计算最大回撤，传入fromDate则只计算该日期至今的区间最大回撤 */
const calcMaxDrawdown = (trends, fromDate) => {
  if (!trends || trends.length < 2) return '—';
  let data = trends;
  if (fromDate) {
    const cutoff = new Date(fromDate).getTime();
    data = trends.filter(item => item.x >= cutoff);
    if (data.length < 2) return '—';
  }
  let maxDD = 0;
  let ddPeak = data[0].y;
  for (let i = 1; i < data.length; i++) {
    const val = data[i].y;
    if (val > ddPeak) { ddPeak = val; }
    else {
      const dd = (val - ddPeak) / ddPeak;
      if (dd < maxDD) maxDD = dd;
    }
  }
  const result = (maxDD * 100).toFixed(2);
  // 防御：回撤超过99%视为数据异常
  return parseFloat(result) < -99 ? '—' : result;
};

/** 计算区间当前回撤：从指定日期至今，(最新净值 - 该时间段内最高净值) / 最高净值 */
const calcCurDrawdown = (trends, fromDate) => {
  if (!trends || trends.length < 2) return '—';
  const cutoff = new Date(fromDate).getTime();
  const filtered = trends.filter(item => item.x >= cutoff);
  if (filtered.length < 2) return '—';
  let peak = filtered[0].y;
  for (let i = 1; i < filtered.length; i++) {
    if (filtered[i].y > peak) peak = filtered[i].y;
  }
  const cur = filtered[filtered.length - 1].y;
  const dd = ((cur - peak) / peak * 100).toFixed(2);
  return parseFloat(dd) < -99 ? '—' : dd;
};

/** 涨跌幅颜色类名：正数→up(红) 负数→down(绿) */
const getChangeClass = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num < 0 ? 'down' : num > 0 ? 'up' : '';
};

/** 根据代码查基金名称 */
const getFundName = (code) => FUND_NAME_MAP[code] || '暂无名称信息';

/** 拆分估值时间：将"YYYY-MM-DD HH:mm"拆为{date, time} */
const splitGztime = (gztime) => {
  if (!gztime || gztime === '—') return { date: '—', time: '' };
  const idx = gztime.lastIndexOf(' ');
  if (idx === -1) return { date: gztime, time: '' };
  return { date: gztime.substring(0, idx), time: gztime.substring(idx + 1) };
};

/** 判断代码是否在输入框已选中 */
const isCodeSelected = (code) => {
  const codes = inputCodes.value.split(/[，,\s]+/).filter(c => /^\d{6}$/.test(c));
  return codes.includes(code);
};

/** 切换代码选中状态 */
const toggleCode = (code) => {
  const raw = inputCodes.value.trim();
  let codes = raw ? raw.split(/[，,\s]+/).filter(c => /^\d{6}$/.test(c)) : [];
  if (codes.includes(code)) {
    codes = codes.filter(c => c !== code);
  } else {
    codes.push(code);
  }
  inputCodes.value = codes.join(',');
};

/** JSONP方式加载基金历史累计净值数据（东方财富接口） */
const loadHistoryData = (code) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://fund.eastmoney.com/pingzhongdata/${code}.js`;
    const timeout = setTimeout(() => { cleanup(); reject(new Error('历史数据请求超时')); }, 8000);
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      window.fS_name = undefined;
      window.Data_ACWorthTrend = undefined;
    };
    script.onload = () => {
      clearTimeout(timeout);
      try {
        const name = window.fS_name;
        const rawTrends = window.Data_ACWorthTrend;
        if (!name || !rawTrends || !Array.isArray(rawTrends) || rawTrends.length === 0) throw new Error('历史净值数据缺失');
        // Data_ACWorthTrend格式为[日期字符串, 净值]的二维数组，统一转为{x: 时间戳, y: 净值}
        const trends = rawTrends.map(item => ({
          x: Array.isArray(item) ? new Date(item[0]).getTime() : item.x,
          y: Array.isArray(item) ? parseFloat(item[1]) : parseFloat(item.y),
        })).filter(item => !isNaN(item.x) && Number.isFinite(item.y) && item.y > 0);
        if (trends.length === 0) throw new Error('累计净值数据异常（过滤后无有效数据），请检查基金代码');
        let maxItem = trends[0];
        for (const item of trends) { if (item.y > maxItem.y) maxItem = item; }
        const currentItem = trends[trends.length - 1];
        const result = {
          name, maxDate: formatDate(maxItem.x), maxValue: maxItem.y,
          curDate: formatDate(currentItem.x), curValue: currentItem.y,
          drawdown: calcMaxDrawdown(trends),
          curDrawdown: calcCurDrawdown(trends, drawdownDate.value),
          rangeMaxDrawdown: calcMaxDrawdown(trends, drawdownDate.value),
        };
        cleanup(); resolve(result);
      } catch (e) { cleanup(); reject(e); }
    };
    script.onerror = () => { cleanup(); reject(new Error('加载历史脚本失败（代码可能不存在）')); };
    document.head.appendChild(script);
  });
};

/** JSONP方式加载基金实时估值数据（天天基金接口） */
const loadRealTimeData = (code) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://fundgz.1234567.com.cn/js/${code}.js?callback=jsonpgz`;
    const timeout = setTimeout(() => { cleanup(); reject(new Error('实时估值请求超时')); }, 6000);
    window.jsonpgz = (data) => {
      clearTimeout(timeout); cleanup();
      if (data && data.dwjz && data.gsz && parseFloat(data.gsz) > 0 && data.gztime) {
        resolve({ dwjz: parseFloat(data.dwjz), gsz: parseFloat(data.gsz), gszzl: data.gszzl, gztime: data.gztime, name: data.name || '' });
      } else { reject(new Error('暂无实时估值')); }
    };
    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      window.jsonpgz = undefined;
    };
    script.onerror = () => { cleanup(); reject(new Error('实时估值脚本加载失败')); };
    document.head.appendChild(script);
  });
};

/** 并发加载单只基金的完整数据（历史+实时），历史数据失败则整体失败 */
const loadFundFull = async (code) => {
  const [historyResult, realtimeResult] = await Promise.allSettled([
    loadHistoryData(code), loadRealTimeData(code),
  ]);
  const data = {
    code, name: '—', maxDate: '—', maxValue: '—', curDate: '—', curValue: '—',
    drawdown: '—', curDrawdown: '—', rangeMaxDrawdown: '—',
    gsz: '—', gztime: '—', dwjz: '—', todayChange: '—',
  };
  if (historyResult.status === 'fulfilled') {
    Object.assign(data, historyResult.value);
  } else { throw new Error(historyResult.reason.message); }
  if (realtimeResult.status === 'fulfilled') {
    const r = realtimeResult.value;
    data.gsz = r.gsz; data.gztime = r.gztime; data.dwjz = r.dwjz;
    if (r.gszzl && !isNaN(parseFloat(r.gszzl))) { data.todayChange = r.gszzl + '%'; }
    else { data.todayChange = ((r.gsz - r.dwjz) / r.dwjz * 100).toFixed(2) + '%'; }
  }
  return data;
};

/** 解析输入框基金代码，串行加载并展示结果 */
const handleQuery = async () => {
  const raw = inputCodes.value.trim();
  if (!raw) return;
  const codes = raw.split(/[，,\s]+/).filter((c) => /^\d{6}$/.test(c));
  if (codes.length === 0) return;
  loading.value = true;
  statusText.value = '开始加载...';
  fundList.value = [];
  errors.value = [];
  const results = [], errs = [];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    statusText.value = `正在加载 ${i + 1}/${codes.length} : ${code} ...`;
    try { const data = await loadFundFull(code); results.push(data); }
    catch (err) { errs.push({ code, message: err.message }); }
  }
  fundList.value = results;
  errors.value = errs;
  statusText.value = errs.length > 0
    ? `完成（成功 ${results.length} 只，失败 ${errs.length} 只）`
    : `✅ 全部加载完成，共 ${results.length} 只基金`;
  loading.value = false;
};

onMounted(handleQuery);
</script>

<style lang="scss" scoped>
@import url('./style/fundInformationSearch.scss');
</style>
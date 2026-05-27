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
        <el-button type="primary" size="large" :loading="loading" @click="handleQuery">
          开始查询
        </el-button>
        <span v-if="statusText" class="status-text">{{ statusText }}</span>
      </div>

      <div v-if="errors.length" class="error-area">
        <el-alert title="以下基金查询失败" type="error" :closable="false" show-icon>
          <ul>
            <li v-for="e in errors" :key="e.code">{{ e.code }}：{{ e.message }}</li>
          </ul>
        </el-alert>
      </div>
    </el-card>

    <!-- 桌面端：表格布局 -->
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
        <el-table-column prop="maxDate" label="最高净值日期" width="120" />
        <el-table-column prop="maxValue" label="最高净值" width="110" />
        <el-table-column prop="curDate" label="最新日期" width="120" />
        <el-table-column prop="curValue" label="最新净值" width="110" />
        <el-table-column prop="drawdown" label="历史回撤" width="120">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown)">{{ row.drawdown }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="drawdown3y" label="近三年回撤" width="140">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown3y)">{{ row.drawdown3y }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="drawdown2y" label="近二年回撤" width="140">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown2y)">{{ row.drawdown2y }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="drawdown1y" label="近一年回撤" width="140">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown1y)">{{ row.drawdown1y }}%</span>
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
        <el-table-column prop="todayChange" label="今日涨跌幅" width="130">
          <template #default="{ row }">
            <span v-if="row.todayChange !== '—'" :class="getChangeClass(row.todayChange)">
              {{ row.todayChange }}
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 移动端：卡片布局 -->
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
              <div class="data-label">历史回撤</div>
              <div class="data-value">
                <span :class="getChangeClass(fund.drawdown)">{{ fund.drawdown }}%</span>
              </div>
            </div>
          </div>

          <div class="data-row three-col">
            <div class="data-item">
              <div class="data-label">近三年回撤</div>
              <div class="data-value">
                <span :class="getChangeClass(fund.drawdown3y)">{{ fund.drawdown3y }}%</span>
              </div>
            </div>
            <div class="data-item">
              <div class="data-label">近二年回撤</div>
              <div class="data-value">
                <span :class="getChangeClass(fund.drawdown2y)">{{ fund.drawdown2y }}%</span>
              </div>
            </div>
            <div class="data-item">
              <div class="data-label">近一年回撤</div>
              <div class="data-value">
                <span :class="getChangeClass(fund.drawdown1y)">{{ fund.drawdown1y }}%</span>
              </div>
            </div>
          </div>

          <div class="data-row">
            <div class="data-item">
              <div class="data-label">最新日期</div>
              <div class="data-value">{{ fund.curDate }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">最新净值</div>
              <div class="data-value">{{ fund.curValue }}</div>
            </div>
          </div>

          <div class="data-row">
            <div class="data-item">
              <div class="data-label">最高净值日期</div>
              <div class="data-value">{{ fund.maxDate }}</div>
            </div>
            <div class="data-item">
              <div class="data-label">最高净值</div>
              <div class="data-value">{{ fund.maxValue }}</div>
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


const fundList = ref([]);
const errors = ref([]);
const loading = ref(false);
const statusText = ref('');


const FUND_NAME_MAP = {
  '008186': '淳厚信睿混合A',
  '012454': '淳厚鑫悦混合A',
  '017498': '淳厚添益债券A',
  '011370': '华商均衡成长混合C',
  '690002': '民生增强收益债券A',
  '006030': '南方昌元可转债债券A',
  '110020': '易方达沪深300ETF联接A',
  '022453': '嘉实中证A500ETF联接A',
  '005763': '中欧电子信息产业沪港深股票C',
  '720001': '财通价值动量混合A',
  '013402': '华夏恒生科技ETF发起式联接(QDII)A',
  '040046': '华安纳斯达克100ETF联接(QDII)A',
  '050025': '博时标普500ETF联接A',
  '100032': '富国中证红利指数增强A',
  '006327': '易方达中证海外互联网50ETF联接(QDII)A',
  '003624': '创金合信资源股票发起式A',
  '160213': '国泰纳斯达克100指数(QDII)',
  '161005': '富国天惠成长混合(LOF)A',
  '164906': '交银中证海外中国互联网指数(LOF)A'
};
let fundCodeList = Object.keys(FUND_NAME_MAP).map(key => key);
const commonCodes = fundCodeList;
const inputCodes = ref(fundCodeList.join(','));
const formatDate = (ts) => {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 计算最近 N 年内的最大回撤（返回百分比数字字符串，如 "-15.23"）
const calcMaxDrawdown = (trends, years) => {
  if (!trends || trends.length < 2) return '—';
  const now = new Date();
  const cutoff = new Date(now.getFullYear() - years, now.getMonth(), now.getDate()).getTime();
  const filtered = trends.filter(item => item.x >= cutoff);
  if (filtered.length < 2) return '—';

  let maxDD = 0;
  let peak = filtered[0].y;

  for (let i = 1; i < filtered.length; i++) {
    const val = filtered[i].y;
    if (val > peak) {
      peak = val;
    } else {
      const dd = (val - peak) / peak;
      if (dd < maxDD) maxDD = dd;
    }
  }

  return (maxDD * 100).toFixed(2);
};

const getChangeClass = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return num < 0 ? 'down' : num > 0 ? 'up' : '';
};

const getFundName = (code) => {
  return FUND_NAME_MAP[code] || '暂无名称信息';
};

const splitGztime = (gztime) => {
  if (!gztime || gztime === '—') return { date: '—', time: '' };
  const idx = gztime.lastIndexOf(' ');
  if (idx === -1) return { date: gztime, time: '' };
  return {
    date: gztime.substring(0, idx),
    time: gztime.substring(idx + 1)
  };
};

const isCodeSelected = (code) => {
  const codes = inputCodes.value.split(/[，,\s]+/).filter(c => /^\d{6}$/.test(c));
  return codes.includes(code);
};

const toggleCode = (code) => {
  const raw = inputCodes.value.trim();
  let codes = raw ? raw.split(/[，,\s]+/).filter(c => /^\d{6}$/.test(c)) : [];
  if (codes.includes(code)) {
    codes = codes.filter(c => c !== code);
    inputCodes.value = codes.join(',');
  } else {
    codes.push(code);
    inputCodes.value = codes.join(',');
  }
};

// ----- 数据加载逻辑（不变） -----
const loadHistoryData = (code) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://fund.eastmoney.com/pingzhongdata/${code}.js`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('历史数据请求超时'));
    }, 8000);

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      window.fS_name = undefined;
      window.Data_netWorthTrend = undefined;
    };

    script.onload = () => {
      clearTimeout(timeout);
      try {
        const name = window.fS_name;
        const trends = window.Data_netWorthTrend;
        if (!name || !trends || !Array.isArray(trends) || trends.length === 0) {
          throw new Error('历史净值数据缺失');
        }
        let maxItem = trends[0];
        for (const item of trends) {
          if (item.y > maxItem.y) maxItem = item;
        }
        const currentItem = trends[trends.length - 1];

        const result = {
          name,
          maxDate: formatDate(maxItem.x),
          maxValue: maxItem.y,
          curDate: formatDate(currentItem.x),
          curValue: currentItem.y,
          drawdown: ((currentItem.y - maxItem.y) / maxItem.y * 100).toFixed(2),
          drawdown3y: calcMaxDrawdown(trends, 3),
          drawdown2y: calcMaxDrawdown(trends, 2),
          drawdown1y: calcMaxDrawdown(trends, 1),
        };
        cleanup();
        resolve(result);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('加载历史脚本失败（代码可能不存在）'));
    };

    document.head.appendChild(script);
  });
};

const loadRealTimeData = (code) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://fundgz.1234567.com.cn/js/${code}.js?callback=jsonpgz`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('实时估值请求超时'));
    }, 6000);

    window.jsonpgz = (data) => {
      clearTimeout(timeout);
      cleanup();
      if (data && data.dwjz && data.gsz && parseFloat(data.gsz) > 0 && data.gztime) {
        resolve({
          dwjz: parseFloat(data.dwjz),
          gsz: parseFloat(data.gsz),
          gszzl: data.gszzl,
          gztime: data.gztime,
          name: data.name || '',
        });
      } else {
        reject(new Error('暂无实时估值'));
      }
    };

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      window.jsonpgz = undefined;
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('实时估值脚本加载失败'));
    };

    document.head.appendChild(script);
  });
};

const loadFundFull = async (code) => {
  const [historyResult, realtimeResult] = await Promise.allSettled([
    loadHistoryData(code),
    loadRealTimeData(code),
  ]);

  const data = {
    code,
    name: '—',
    maxDate: '—',
    maxValue: '—',
    curDate: '—',
    curValue: '—',
    drawdown: '—',
    drawdown3y: '—',
    drawdown2y: '—',
    drawdown1y: '—',
    gsz: '—',
    gztime: '—',
    dwjz: '—',
    todayChange: '—',
  };

  if (historyResult.status === 'fulfilled') {
    Object.assign(data, historyResult.value);
  } else {
    throw new Error(historyResult.reason.message);
  }

  if (realtimeResult.status === 'fulfilled') {
    const r = realtimeResult.value;
    data.gsz = r.gsz;
    data.gztime = r.gztime;
    data.dwjz = r.dwjz;
    if (r.gszzl && !isNaN(parseFloat(r.gszzl))) {
      data.todayChange = r.gszzl + '%';
    } else {
      const change = ((r.gsz - r.dwjz) / r.dwjz * 100).toFixed(2);
      data.todayChange = change + '%';
    }
  }

  return data;
};

const handleQuery = async () => {
  const raw = inputCodes.value.trim();
  if (!raw) return;

  const codes = raw.split(/[，,\s]+/).filter((c) => /^\d{6}$/.test(c));
  if (codes.length === 0) return;

  loading.value = true;
  statusText.value = '开始加载...';
  fundList.value = [];
  errors.value = [];

  const results = [];
  const errs = [];

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    statusText.value = `正在加载 ${i + 1}/${codes.length} : ${code} ...`;
    try {
      const data = await loadFundFull(code);
      results.push(data);
    } catch (err) {
      errs.push({ code, message: err.message });
    }
  }

  fundList.value = results;
  errors.value = errs;
  statusText.value =
    errs.length > 0
      ? `完成（成功 ${results.length} 只，失败 ${errs.length} 只）`
      : `✅ 全部加载完成，共 ${results.length} 只基金`;

  loading.value = false;
};

onMounted(() => {
  handleQuery();
});
</script>

<style lang="scss" scoped>
@import url('./style/fundInformationSearch.scss');
</style>
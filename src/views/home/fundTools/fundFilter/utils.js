// ==================== 配置 ====================
// 使用代理前缀，开发环境代理配置见 vite.config.js 或 vue.config.js
// fund.eastmoney.com → /api-fund
export const API_PROXY = '/api-fund'

// AbortController 管理：用于在组件卸载时取消所有进行中的请求
let abortController = null

/**
 * 获取或创建一个新的 AbortController。
 * 每次调用会自动 abort 上一个未完成的 controller，确保同一时间只有一批请求。
 * @returns {{ signal: AbortSignal, controller: AbortController }}
 */
export function getAbortSignal() {
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  return { signal: abortController.signal, controller: abortController }
}

/**
 * 取消所有进行中的请求（组件卸载时调用）
 */
export function cancelAllRequests() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

/**
 * 检查请求是否因 AbortController 被取消
 */
function isAbortError(err) {
  return err && (err.name === 'AbortError' || err.code === 20)
}

// ==================== 解析函数 ====================
// 解析基金基础数据 (fundcode_search.js)
export function parseFundBasicList(content) {
  let match = content.match(/var\s+r\s*=\s*(\[[\s\S]*\]);?/)
  if (!match) {
    match = content.match(/var\s+fundCodeList\s*=\s*(\[[\s\S]*\]);?/)
  }
  if (!match) {
    console.warn('[parseFundBasicList] 未匹配到变量 r 或 fundCodeList')
    return []
  }
  try {
    const data = JSON.parse(match[1])
    console.log(`[parseFundBasicList] 解析到 ${data.length} 条原始数据，示例:`, data[0])
    return data.map(item => ({
      code: item[0],
      name: item[1],
      type: item[3]
    }))
  } catch (e) {
    console.error('[parseFundBasicList] JSON解析失败:', e)
    console.error('[parseFundBasicList] 匹配到的文本前100字符:', match[1].substring(0, 100))
    return []
  }
}

// 解析排名数据 (rankhandler.aspx)
// 字段索引: [0]code [1]name [2]pinyin [3]date [4]unitNav [5]accNav
//   [6]d1 [7]d7 [8]m1 [9]m3 [10]m6 [11]y1 [12]y2 [13]y3 [14]ytd [15]since
//   [16]estDate [17]rating [18]fundSize? [19]fee [20]discFee [21]... [24]rankChange?
export function parseRankData(content) {
  try {
    const match = content.match(/var\s+rankData\s*=\s*(\{[^]*\});?/)
    if (!match) {
      console.warn('[parseRankData] 未找到 var rankData')
      return []
    }
    // 东方财富返回的是 JavaScript object literal，key 没引号，需先转成合法 JSON
    let jsonStr = match[1]
    console.log('[parseRankData] JSON 长度:', jsonStr.length, '前100字符:', jsonStr.substring(0, 100))
    // 给 key 加双引号，把 {datas: [...]} 变成 {"datas": [...]}
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    let json
    try {
      json = JSON.parse(jsonStr)
    } catch (parseErr) {
      console.error('[parseRankData] JSON修复后仍失败，尝试 eval...', parseErr.message)
      try {
        const fn = new Function('return ' + match[1])
        json = fn()
      } catch (evalErr) {
        console.error('[parseRankData] eval 也失败:', evalErr)
        return []
      }
    }
    const items = json.datas || []
    console.log(`[parseRankData] datas 数组长度: ${items.length}, 第一条:`, items[0]?.substring(0, 100))
    return items.map(str => {
      const parts = str.split(',')
      // parts[18] 在基金成立较久时是规模数据，新基金时和成立以来涨幅相同（不可靠）
      // 规模将在 pingzhongdata 接口中获取更准确的数据，这里先用默认值
      let fundSize = 10
      // 仅当 parts[18] 和 parts[15](成立以来涨幅) 不同且值合理时才使用
      const v18 = parseFloat(parts[18])
      const since = parseFloat(parts[15])
      if (!isNaN(v18) && v18 > 0.01 && v18 < 10000 && Math.abs(v18 - since) > 1) {
        fundSize = v18
      }
      return {
        code: parts[0] || '',
        name: parts[1] || '',
        type: parts[2] || '--',
        return1m: parseFloat(parts[8]) || 0,   // 近1月收益
        return3m: parseFloat(parts[9]) || 0,   // 近3月收益
        return6m: parseFloat(parts[10]) || 0,  // 近6月收益
        return1y: parseFloat(parts[11]) || 0,  // 近1年收益
        return3y: parseFloat(parts[13]) || 0,  // 近3年收益（用于稳健型粗筛）
        maxDrawdown: null,  // 排名接口不含回撤，需从历史净值计算
        fundSize: fundSize
      }
    })
  } catch (e) {
    console.error('[parseRankData] 解析失败:', e)
    return []
  }
}

// ==================== 计算函数 ====================
// 年化收益
export function calcAnnualizedReturn(netValues, years) {
  if (netValues.length < 2) return 0
  const start = netValues[0]
  const end = netValues[netValues.length - 1]
  if (start <= 0 || end <= 0) return 0
  const totalReturn = (end - start) / start
  return (Math.pow(1 + totalReturn, 1 / years) - 1) * 100
}

// 最大回撤（应传入累计净值，而非单位净值）
export function calcMaxDrawdown(accNetValues) {
  if (accNetValues.length === 0) return 0
  let peak = accNetValues[0]
  let maxDD = 0
  for (let i = 1; i < accNetValues.length; i++) {
    if (accNetValues[i] > peak) peak = accNetValues[i]
    const dd = (peak - accNetValues[i]) / peak
    if (dd > maxDD) maxDD = dd
  }
  return -maxDD * 100
}

// 夏普比率
export function calcSharpeRatio(dailyReturns, riskFreeRate = 0.025) {
  if (dailyReturns.length === 0) return 0
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length
  const std = Math.sqrt(variance)
  if (std === 0) return 0
  const annualizedReturn = mean * 252
  const annualizedStd = std * Math.sqrt(252)
  return (annualizedReturn - riskFreeRate) / annualizedStd
}

// 归一化辅助（默认越大越好，用于收益/夏普/经理年限/规模）
export function norm(arr, val) {
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  return max === min ? 0.5 : (val - min) / (max - min)
}

// 归一化（越小越好，用于回撤等负向指标，传入值一般为负数如 -5、-50）
export function normInverse(arr, val) {
  const min = Math.min(...arr)  // 最差，如 -50
  const max = Math.max(...arr)  // 最好，如 -5
  return max === min ? 0.5 : (val - min) / (max - min)
}

// ==================== 数据获取 ====================
// 获取所有基金列表
export async function fetchAllFunds(signal = null) {
  try {
    const url = `${API_PROXY}/js/fundcode_search.js`
    console.log('[fetchAllFunds] 请求 URL:', url)
    const res = await fetch(url, { signal })
    console.log('[fetchAllFunds] 响应状态:', res.status, res.statusText)
    const text = await res.text()
    console.log('[fetchAllFunds] 响应文本长度:', text.length)
    console.log('[fetchAllFunds] 响应文本前200字符:', text.substring(0, 200))
    const result = parseFundBasicList(text)
    console.log('[fetchAllFunds] 解析结果数量:', result.length)
    return result
  } catch (e) {
    if (isAbortError(e)) {
      console.log('[fetchAllFunds] 请求已取消')
    } else {
      console.error('[fetchAllFunds] 请求失败:', e)
    }
    return []
  }
}

// 获取基金历史净值 + 经理/规模信息 - JSONP 方式
// 返回 { history: [...], managerYears: number, fundSize: number }
// signal: AbortSignal，用于取消请求
export async function fetchHistory(code, signal = null) {
  try {
    const result = await new Promise((resolve, reject) => {
      // 检查是否已取消
      if (signal && signal.aborted) {
        reject(new DOMException('请求已取消', 'AbortError'))
        return
      }

      const script = document.createElement('script')
      // 用相对协议避免 https/http 混用问题
      script.src = `/api-fund-jsonp/${code}.js`
      let resolved = false

      const onAbort = () => {
        if (!resolved) {
          cleanup()
          reject(new DOMException('请求已取消', 'AbortError'))
        }
      }

      const timeout = setTimeout(() => {
        if (!resolved) {
          cleanup()
          reject(new Error('请求超时'))
        }
      }, 8000)
      const cleanup = () => {
        resolved = true
        clearTimeout(timeout)
        if (signal) signal.removeEventListener('abort', onAbort)
        if (script.parentNode) script.parentNode.removeChild(script)
        // 清理全局变量
        const keys = [
          'Data_netWorthTrend', 'Data_ACWorthTrend',
          'Data_currentFundManager', 'Data_assetAllocation',
          'Data_fundSharesPositions', 'Data_holderStructure',
          'Data_performanceEvaluation', 'Data_buySedemption',
          'swithSameType', 'stockCodes', 'stockCodesNew',
          'zqCodes', 'zqCodesNew', 'fS_name', 'fS_code',
          'fund_sourceRate', 'fund_Rate', 'fund_minsg',
          'syl_1n', 'syl_6y', 'syl_3y', 'syl_1y', 'ishb'
        ]
        keys.forEach(k => { window[k] = undefined })
      }

      if (signal) {
        signal.addEventListener('abort', onAbort)
      }

      script.onload = () => {
        if (resolved) return
        clearTimeout(timeout)
        try {
          const trends = window.Data_netWorthTrend
          const acTrends = window.Data_ACWorthTrend
          if (!trends || !Array.isArray(trends) || trends.length === 0) {
            throw new Error('无净值数据')
          }
          // 构建累计净值映射：按日期对齐
          const acMap = new Map()
          if (acTrends && Array.isArray(acTrends)) {
            acTrends.forEach(item => {
              const date = typeof item.x === 'number' ? new Date(item.x).toISOString().slice(0, 10) : item.x
              acMap.set(date, parseFloat(item.y))
            })
          }
          const history = trends.map(item => {
            const date = typeof item.x === 'number' ? new Date(item.x).toISOString().slice(0, 10) : item.x
            return {
              date,
              netValue: parseFloat(item.y),
              accNetValue: acMap.get(date) || parseFloat(item.y), // 累计净值，没有则降级为单位净值
              dailyReturn: item.equityReturn ? parseFloat(item.equityReturn) : 0
            }
          })

          // 提取经理年限
          let managerYears = 0
          try {
            const mgr = window.Data_currentFundManager
            if (mgr && Array.isArray(mgr) && mgr.length > 0) {
              const workTime = mgr[0].workTime || ''
              // 解析 "1年又86天" 或 "2年又30天"
              const yearMatch = workTime.match(/([\d.]+)\s*年/)
              const dayMatch = workTime.match(/([\d.]+)\s*天/)
              if (yearMatch) {
                managerYears = parseFloat(yearMatch[1])
                if (dayMatch) managerYears += parseFloat(dayMatch[1]) / 365
              }
            }
          } catch (e) { /* 忽略经理数据解析错误 */ }

          // 提取基金规模（最新季度净资产）
          let fundSize = 0
          try {
            const alloc = window.Data_assetAllocation
            if (alloc && alloc.series) {
              const netAssetSeries = alloc.series.find(s => s.name === '净资产')
              if (netAssetSeries && netAssetSeries.data && netAssetSeries.data.length > 0) {
                const latest = parseFloat(netAssetSeries.data[netAssetSeries.data.length - 1])
                if (!isNaN(latest) && latest > 0) fundSize = latest
              }
            }
          } catch (e) { /* 忽略规模数据解析错误 */ }

          cleanup()
          resolve({ history, managerYears, fundSize })
        } catch (e) {
          cleanup()
          reject(e)
        }
      }
      script.onerror = () => {
        cleanup()
        reject(new Error('脚本加载失败'))
      }
      document.head.appendChild(script)
    })
    console.log(`[fetchHistory] ${code} JSONP 获取到 ${result.history.length} 条净值, 经理${result.managerYears.toFixed(1)}年, 规模${result.fundSize.toFixed(1)}亿`)
    return result
  } catch (e) {
    if (isAbortError(e)) {
      console.log(`[fetchHistory] ${code} 请求已取消`)
      return { history: [], managerYears: 0, fundSize: 0 }
    }
    console.warn(`[fetchHistory] ${code} 失败(可能是后端收费/无净值数据):`, e.message)
    return { history: [], managerYears: 0, fundSize: 0 }
  }
}

// 获取排名数据 (进取型)
export async function fetchRankData(signal = null) {
  try {
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - 1)
    const format = d => d.toISOString().slice(0, 10)
    const url = `${API_PROXY}/data/rankhandler.aspx?op=ph&dt=kf&ft=all&gs=0&sc=6yzf&st=desc&sd=${format(start)}&ed=${format(end)}&pi=1&pn=100`
    console.log('[fetchRankData] 请求 URL:', url)
    const res = await fetch(url, { signal })
    console.log('[fetchRankData] 响应状态:', res.status)
    const text = await res.text()
    console.log('[fetchRankData] 响应文本长度:', text.length)
    console.log('[fetchRankData] 响应文本前200字符:', text.substring(0, 200))
    const result = parseRankData(text)
    console.log('[fetchRankData] 解析结果数量:', result.length)
    return result
  } catch (e) {
    if (isAbortError(e)) {
      console.log('[fetchRankData] 请求已取消')
    } else {
      console.error('[fetchRankData] 请求失败:', e)
    }
    return []
  }
}

// 获取排名数据 (稳健型专用 - 按3年收益排，取top 300)
export async function fetchRankDataStable(signal = null) {
  try {
    const end = new Date()
    const start = new Date()
    start.setFullYear(start.getFullYear() - 3)
    const format = d => d.toISOString().slice(0, 10)
    const url = `${API_PROXY}/data/rankhandler.aspx?op=ph&dt=kf&ft=all&gs=0&sc=3yzf&st=desc&sd=${format(start)}&ed=${format(end)}&pi=1&pn=300&dx=1`
    console.log('[fetchRankDataStable] 请求 URL:', url)
    const res = await fetch(url, { signal })
    console.log('[fetchRankDataStable] 响应状态:', res.status)
    const text = await res.text()
    console.log('[fetchRankDataStable] 响应文本长度:', text.length)
    const result = parseRankData(text)
    console.log('[fetchRankDataStable] 解析结果数量:', result.length)
    return result
  } catch (e) {
    if (isAbortError(e)) {
      console.log('[fetchRankDataStable] 请求已取消')
    } else {
      console.error('[fetchRankDataStable] 请求失败:', e)
    }
    return []
  }
}

// 获取单个基金的实时估值 - JSONP 方式
// 返回 { fundcode, name, jzrq, dwjz, gsz, gszzl, gztime } 或 null
// signal: AbortSignal，用于取消请求
export async function fetchFundEstimate(code, signal = null) {
  try {
    const result = await new Promise((resolve, reject) => {
      // 检查是否已取消
      if (signal && signal.aborted) {
        reject(new DOMException('请求已取消', 'AbortError'))
        return
      }

      const script = document.createElement('script')
      script.src = `/api-estimate/${code}.js`
      let resolved = false

      const onAbort = () => {
        if (!resolved) {
          cleanup()
          reject(new DOMException('请求已取消', 'AbortError'))
        }
      }

      const timeout = setTimeout(() => {
        if (!resolved) {
          cleanup()
          reject(new Error('估值请求超时'))
        }
      }, 5000)
      const callbackName = 'jsonpgz'
      const origCallback = window[callbackName]
      window[callbackName] = (data) => {
        if (resolved) return
        clearTimeout(timeout)
        cleanup()
        window[callbackName] = origCallback
        resolve(data)
      }
      const cleanup = () => {
        resolved = true
        clearTimeout(timeout)
        if (signal) signal.removeEventListener('abort', onAbort)
        if (script.parentNode) script.parentNode.removeChild(script)
      }

      if (signal) {
        signal.addEventListener('abort', onAbort)
      }

      script.onerror = () => {
        cleanup()
        reject(new Error('估值脚本加载失败'))
      }
      document.head.appendChild(script)
    })
    return result
  } catch (e) {
    if (isAbortError(e)) {
      console.log(`[fetchFundEstimate] ${code} 估值请求已取消`)
    } else {
      console.warn(`[fetchFundEstimate] ${code} 估值获取失败:`, e.message)
    }
    return null
  }
}

// 批量获取基金实时估值（每批 CONCURRENCY 个）
// 返回 [{ code, dwjz, gsz, gszzl, gztime }, ...]
// signal: AbortSignal，用于取消请求
export async function fetchEstimatesBatch(codes, concurrency = 10, signal = null) {
  const results = []
  for (let i = 0; i < codes.length; i += concurrency) {
    // 每批次前检查是否已取消
    if (signal && signal.aborted) {
      console.log('[fetchEstimatesBatch] 请求已取消，停止后续批次')
      break
    }
    const batch = codes.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(code => fetchFundEstimate(code, signal))
    )
    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j]
      if (r.status === 'fulfilled' && r.value) {
        results.push({
          code: batch[j],
          dwjz: parseFloat(r.value.dwjz) || 0,
          gsz: parseFloat(r.value.gsz) || 0,
          gszzl: parseFloat(r.value.gszzl) || 0,
          gztime: r.value.gztime || ''
        })
      } else {
        results.push({ code: batch[j], dwjz: 0, gsz: 0, gszzl: 0, gztime: '' })
      }
    }
  }
  return results
}

// 并行批量获取历史数据（每批 CONCURRENCY 个）
// 返回 [{ code, history, managerYears, fundSize }, ...]
// signal: AbortSignal，用于取消请求
export async function fetchHistoryBatch(codes, concurrency = 5, signal = null) {
  const results = []
  for (let i = 0; i < codes.length; i += concurrency) {
    // 每批次前检查是否已取消
    if (signal && signal.aborted) {
      console.log('[fetchHistoryBatch] 请求已取消，停止后续批次')
      break
    }
    const batch = codes.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(code => fetchHistory(code, signal))
    )
    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j]
      if (r.status === 'fulfilled') {
        results.push({
          code: batch[j],
          history: r.value.history || [],
          managerYears: r.value.managerYears || 0,
          fundSize: r.value.fundSize || 0
        })
      } else {
        results.push({
          code: batch[j],
          history: [],
          managerYears: 0,
          fundSize: 0
        })
      }
    }
    console.log(`[fetchHistoryBatch] 已完成 ${Math.min(i + concurrency, codes.length)}/${codes.length}`)
  }
  return results
}

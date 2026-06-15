/**
 * 大道七线 · 股票分析工具函数
 * 供 DaDaoQiXianPanel 和 DaDaoQiXianDetail 共用
 */

// ==================== 均线计算 ====================
export function SMA(data, period) {
  const result = new Array(data.length).fill(null)
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) sum += data[i - j]
    result[i] = sum / period
  }
  return result
}

// ==================== RSI ====================
export function calcRSI(data, period = 14) {
  const rsiArr = new Array(data.length).fill(null)
  if (data.length < period + 1) return rsiArr
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1]
    if (diff >= 0) gains += diff
    else losses -= diff
  }
  let avgGain = gains / period, avgLoss = losses / period
  let rs = avgGain / (avgLoss === 0 ? 1e-9 : avgLoss)
  rsiArr[period] = 100 - (100 / (1 + rs))
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    rs = avgGain / (avgLoss === 0 ? 1e-9 : avgLoss)
    rsiArr[i] = 100 - (100 / (1 + rs))
  }
  return rsiArr
}

// ==================== MACD ====================
export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const calcEMA = (arr, period) => {
    const ema = [arr[0]]
    const multiplier = 2 / (period + 1)
    for (let i = 1; i < arr.length; i++) {
      ema[i] = (arr[i] - ema[i - 1]) * multiplier + ema[i - 1]
    }
    return ema
  }
  const emaF = calcEMA(data, fast)
  const emaS = calcEMA(data, slow)
  const diff = emaF.map((v, i) => v - emaS[i])
  const dea = [...diff]
  const multiplierS = 2 / (signal + 1)
  for (let i = 1; i < diff.length; i++) {
    if (isNaN(dea[i - 1])) continue
    dea[i] = (diff[i] - dea[i - 1]) * multiplierS + dea[i - 1]
  }
  return { diff, dea }
}

// ==================== 交叉检测 ====================
export function detectCross(seriesA, seriesB, idx) {
  if (idx < 1 || seriesA[idx] === null || seriesB[idx] === null ||
      seriesA[idx - 1] === null || seriesB[idx - 1] === null) return 'none'
  const nowUp = seriesA[idx] > seriesB[idx]
  const prevUp = seriesA[idx - 1] > seriesB[idx - 1]
  if (nowUp && !prevUp) return 'golden'
  if (!nowUp && prevUp) return 'dead'
  return 'none'
}

export function detectRecentCross(seriesA, seriesB, idx, days = 5) {
  for (let i = idx; i >= Math.max(1, idx - days); i--) {
    if (detectCross(seriesA, seriesB, i) === 'golden') return true
  }
  return false
}

// ==================== 格式化 ====================
export function fmtMA(val) {
  if (val === null || val === undefined) return 'N/A'
  return val.toFixed(2)
}

export function fmtPct(val) {
  if (val === null || val === undefined || isNaN(val)) return 'N/A'
  return (val > 0 ? '+' : '') + val.toFixed(2) + '%'
}

// ==================== 构建单只股票指标 ====================
export function buildStockMetrics(snapshot, klines) {
  const closePrices = klines.map(k => k.close)
  const volumes = klines.map(k => k.volume)
  const highs = klines.map(k => k.high)
  const lows = klines.map(k => k.low)
  const last = closePrices.length - 1

  const ma17 = SMA(closePrices, 17)
  const ma26 = SMA(closePrices, 26)
  const ma100 = SMA(closePrices, 100)
  const ma145 = SMA(closePrices, 145)
  const ma320 = SMA(closePrices, 320)
  const ma455 = SMA(closePrices, 455)
  const ma732 = SMA(closePrices, 732)

  const cross = detectCross(ma17, ma26, last)
  const isGolden = cross === 'golden'
  const isDead = cross === 'dead'
  const nearGoldenCross = detectRecentCross(ma17, ma26, last, 5)

  const wuChenCross = detectCross(ma100, ma145, last)
  const isWuChenGolden = wuChenCross === 'golden'

  const rsiArr = calcRSI(closePrices)
  const rsiVal = rsiArr[last] != null ? Math.round(rsiArr[last] * 10) / 10 : 50

  const { diff, dea } = calcMACD(closePrices)
  let macdGolden = false
  let macdBull = false
  let macdDeath = false
  if (last > 0 && diff[last] != null && dea[last] != null &&
      diff[last - 1] != null && dea[last - 1] != null) {
    if (diff[last] > dea[last] && diff[last - 1] <= dea[last - 1]) macdGolden = true
    else if (diff[last] < dea[last] && diff[last - 1] >= dea[last - 1]) macdDeath = true
    else if (diff[last] > dea[last]) macdBull = true
  } else if (diff[last] != null && dea[last] != null && diff[last] > dea[last]) {
    macdBull = true
  }

  const macdAboveZero = diff[last] != null && diff[last] > 0
  const macdSignal = macdGolden ? 'MACD金叉 ✓' : (macdBull ? '多头区' : '空头区')

  let volMA20 = 0
  const start = Math.max(0, last - 19)
  for (let i = start; i <= last; i++) volMA20 += volumes[i]
  volMA20 /= (last - start + 1)
  const curVol = volumes[last]
  const volumeSurge = curVol > volMA20 * 1.2
  const volRatio = volMA20 > 0 ? (curVol / volMA20).toFixed(2) : 'N/A'

  const shrinkPullback = last > 0 &&
    closePrices[last] < closePrices[last - 1] &&
    volMA20 > 0 && curVol < volMA20 * 0.8

  const multiHair = !!(ma17[last] && ma26[last] && ma100[last] &&
    ma17[last] > ma26[last] && ma26[last] > ma100[last])

  const bearishAlignment = !!(ma17[last] && ma26[last] && ma100[last] &&
    ma17[last] < ma26[last] && ma26[last] < ma100[last])

  const priceAboveTong = ma17[last] != null && closePrices[last] > ma17[last]
  const priceAboveZi = ma26[last] != null && closePrices[last] > ma26[last]
  const priceAboveWu = ma100[last] != null && closePrices[last] > ma100[last]
  const priceAboveChen = ma145[last] != null && closePrices[last] > ma145[last]
  const priceAboveShen = ma320[last] != null && closePrices[last] > ma320[last]
  const priceAboveMao = ma455[last] != null && closePrices[last] > ma455[last]
  const priceBelowHai = ma732[last] != null && closePrices[last] < ma732[last]

  let highAmplitude = false
  if (last > 0 && closePrices[last - 1] > 0) {
    const amplitude = (highs[last] - lows[last]) / closePrices[last - 1] * 100
    highAmplitude = amplitude > 5
  }

  const priceVal = closePrices[last]
  function calcDist(maVal) {
    if (maVal == null || maVal <= 0) return { val: 0, fmt: 'N/A' }
    const v = (priceVal - maVal) / maVal * 100
    return { val: v, fmt: fmtPct(v) }
  }

  const distTong = calcDist(ma17[last])
  const distZi = calcDist(ma26[last])
  const distWu = calcDist(ma100[last])
  const distChen = calcDist(ma145[last])
  const distShen = calcDist(ma320[last])
  const distMao = calcDist(ma455[last])
  const distHai = calcDist(ma732[last])

  function calcSlope(arr) {
    if (last < 5 || arr[last] == null || arr[last - 5] == null) return null
    return arr[last] > arr[last - 5]
  }

  const ma17Up = calcSlope(ma17)
  const ma26Up = calcSlope(ma26)
  const ma100Up = calcSlope(ma100)
  const ma145Up = calcSlope(ma145)
  const ma320Up = calcSlope(ma320)
  const ma455Up = calcSlope(ma455)
  const ma732Up = calcSlope(ma732)

  function calcPctChange(days) {
    if (last < days || closePrices[last - days] <= 0) return { val: 0, fmt: 'N/A' }
    const v = (closePrices[last] - closePrices[last - days]) / closePrices[last - days] * 100
    return { val: v, fmt: fmtPct(v) }
  }

  const pct5d = calcPctChange(5)
  const pct10d = calcPctChange(10)
  const pct20d = calcPctChange(20)
  const pct60d = calcPctChange(60)

  const maLines = [
    { name: '通线(MA17)', value: ma17[last] },
    { name: '子线(MA26)', value: ma26[last] },
    { name: '午线(MA100)', value: ma100[last] },
    { name: '辰线(MA145)', value: ma145[last] },
    { name: '申线(MA320)', value: ma320[last] },
    { name: '卯线(MA455)', value: ma455[last] },
    { name: '亥线(MA732)', value: ma732[last] },
  ]

  const belowLines = maLines.filter(m => m.value != null && m.value < priceVal).sort((a, b) => b.value - a.value)
  const aboveLines = maLines.filter(m => m.value != null && m.value > priceVal).sort((a, b) => a.value - b.value)

  const supportLine = belowLines[0] ? { name: belowLines[0].name, value: belowLines[0].value.toFixed(2) } : null
  const resistanceLine = aboveLines[0] ? { name: aboveLines[0].name, value: aboveLines[0].value.toFixed(2) } : null

  let score = 0
  if (isGolden) score += 2
  if (nearGoldenCross) score += 2
  if (macdAboveZero) score += 2
  if (macdGolden) score += 1
  if (isWuChenGolden) score += 2
  if (multiHair) score += 2
  if (priceAboveTong) score += 1
  if (priceAboveWu) score += 1
  if (priceAboveChen) score += 1
  if (volumeSurge) score += 1
  if (shrinkPullback) score += 1
  if (isDead) score -= 2
  if (macdDeath) score -= 1
  if (bearishAlignment) score -= 2
  if (rsiVal > 70) score -= 1
  if (priceBelowHai) score -= 1

  let assessmentLevel, assessmentLabel, assessmentText
  if (score >= 6) {
    assessmentLevel = 'strong-bull'
    assessmentLabel = '强烈看多'
    assessmentText = '多个看多信号共振，趋势强劲。可积极参与，注意设好止损位，顺势操作。'
  } else if (score >= 3) {
    assessmentLevel = 'bull'
    assessmentLabel = '偏多'
    assessmentText = '看多信号占优，趋势偏强。可适度参与，建议在支撑位附近介入，控制仓位。'
  } else if (score >= 1) {
    assessmentLevel = 'neutral-bull'
    assessmentLabel = '中性偏多'
    assessmentText = '信号偏多但不强烈，建议观望或轻仓试探，等待更强确认信号再加仓。'
  } else if (score >= -1) {
    assessmentLevel = 'neutral'
    assessmentLabel = '中性'
    assessmentText = '多空力量均衡，无明显方向信号。建议观望为主，等待方向突破后再行动。'
  } else if (score >= -3) {
    assessmentLevel = 'bear'
    assessmentLabel = '偏空'
    assessmentText = '看空信号占优，趋势偏弱。建议减仓或回避，等待企稳信号再考虑介入。'
  } else {
    assessmentLevel = 'strong-bear'
    assessmentLabel = '强烈看空'
    assessmentText = '多个看空信号共振，趋势极弱。应回避为主，不可逆势操作。'
  }

  const changePct = snapshot.f3 != null ? +snapshot.f3 : 0
  const turnoverRate = snapshot.f8 != null ? +snapshot.f8 : 0
  const totalMvRaw = snapshot.f20 || 0
  const totalMvVal = totalMvRaw / 1e8
  const totalMv = totalMvVal >= 10000 ? (totalMvVal / 10000).toFixed(1) + '万'
    : totalMvVal >= 1 ? totalMvVal.toFixed(0) : totalMvVal.toFixed(1)

  return {
    code: snapshot.f12 || '',
    name: snapshot.f14 || '',
    close: closePrices[last],
    changePct,
    changePctVal: changePct,
    turnoverRate: turnoverRate.toFixed(2),
    turnoverVal: turnoverRate,
    totalMv,
    totalMvVal,
    ma17: fmtMA(ma17[last]),
    ma26: fmtMA(ma26[last]),
    ma100: fmtMA(ma100[last]),
    ma145: fmtMA(ma145[last]),
    ma320: fmtMA(ma320[last]),
    ma455: fmtMA(ma455[last]),
    ma732: fmtMA(ma732[last]),
    ma17Val: ma17[last] ?? 0,
    ma26Val: ma26[last] ?? 0,
    ma100Val: ma100[last] ?? 0,
    ma145Val: ma145[last] ?? 0,
    ma320Val: ma320[last] ?? 0,
    ma455Val: ma455[last] ?? 0,
    ma732Val: ma732[last] ?? 0,
    distTong: distTong.fmt, distTongVal: distTong.val,
    distZi: distZi.fmt, distZiVal: distZi.val,
    distWu: distWu.fmt, distWuVal: distWu.val,
    distChen: distChen.fmt, distChenVal: distChen.val,
    distShen: distShen.fmt, distShenVal: distShen.val,
    distMao: distMao.fmt, distMaoVal: distMao.val,
    distHai: distHai.fmt, distHaiVal: distHai.val,
    ma17Up, ma26Up, ma100Up, ma145Up, ma320Up, ma455Up, ma732Up,
    pct5d: pct5d.fmt, pct5dVal: pct5d.val,
    pct10d: pct10d.fmt, pct10dVal: pct10d.val,
    pct20d: pct20d.fmt, pct20dVal: pct20d.val,
    pct60d: pct60d.fmt, pct60dVal: pct60d.val,
    rsiVal,
    volumeVal: curVol / 10000,
    volRatioVal: parseFloat(volRatio) || 0,
    macdDiffVal: diff[last],
    macdDeaVal: dea[last],
    isGolden,
    isDead,
    nearGoldenCross,
    rsi: rsiVal,
    macdGolden,
    macdBull,
    macdDeath,
    macdAboveZero,
    macdSignal,
    volume: (curVol / 10000).toFixed(1),
    volumeSurge,
    volRatio,
    multiHair,
    bearishAlignment,
    wuChenGolden: isWuChenGolden,
    priceAboveTong,
    priceAboveZi,
    priceAboveWu,
    priceAboveChen,
    priceAboveShen,
    priceAboveMao,
    priceBelowHai,
    shrinkPullback,
    highAmplitude,
    rsiOversold: rsiVal < 30,
    rsiOverbought: rsiVal > 70,
    rsiNeutral: rsiVal >= 40 && rsiVal <= 60,
    support: supportLine,
    resistance: resistanceLine,
    volToday: curVol >= 100000000 ? (curVol / 100000000).toFixed(2) + '亿'
      : curVol >= 10000 ? (curVol / 10000).toFixed(0) + '万'
      : curVol.toFixed(0),
    volAvg20: volMA20 >= 100000000 ? (volMA20 / 100000000).toFixed(2) + '亿'
      : volMA20 >= 10000 ? (volMA20 / 10000).toFixed(0) + '万'
      : volMA20.toFixed(0),
    score,
    assessmentLevel,
    assessmentLabel,
    assessmentText,
  }
}

// ==================== 评分相关 ====================
export function scoreLevelClass(score) {
  if (score >= 6) return 'score-strong-bull'
  if (score >= 3) return 'score-bull'
  if (score >= 1) return 'score-neutral-bull'
  if (score >= -1) return 'score-neutral'
  if (score >= -3) return 'score-bear'
  return 'score-strong-bear'
}

export function scoreLevelText(score) {
  if (score >= 6) return '强烈看多'
  if (score >= 3) return '偏多'
  if (score >= 1) return '偏多'
  if (score >= -1) return '中性'
  if (score >= -3) return '偏空'
  return '强烈看空'
}

export function hasAnySignal(stock) {
  return stock.isGolden || stock.isDead || stock.nearGoldenCross || stock.macdGolden ||
    stock.macdDeath || stock.macdAboveZero || stock.wuChenGolden || stock.multiHair ||
    stock.volumeSurge || stock.shrinkPullback || stock.bearishAlignment ||
    stock.rsiOversold || stock.rsiOverbought
}

// ==================== 数据获取 ====================
export async function fetchKline(codeRaw, days = 800, signal) {
  let code = codeRaw.toString().trim()
  let market
  if (code.startsWith('sh')) { market = 'sh'; code = code.replace('sh', '') }
  else if (code.startsWith('sz')) { market = 'sz'; code = code.replace('sz', '') }
  else if (/^6/.test(code)) { market = 'sh' }
  else { market = 'sz' }
  const url = `/staticTool/api/ifzq/appstock/app/fqkline/get?param=${market}${code},day,,,${days},qfq`
  const response = await fetch(url, { signal })
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
    return {
      date: item[0],
      open: parseFloat(item[1]),
      close,
      high: parseFloat(item[3]),
      low: parseFloat(item[4]),
      volume: parseInt(item[5]) || 0,
      changePct: +changePct.toFixed(2)
    }
  })
}

/**
 * 从 qt.gtimg.cn 获取实时行情，构造 push2 兼容的 snapshot 对象
 * 用于个股股诊场景（单只股票查询）
 */
export async function fetchStockSnapshot(codeRaw, signal) {
  let code = codeRaw.toString().trim()
  if (!code.startsWith('sh') && !code.startsWith('sz')) {
    code = /^6/.test(code) ? 'sh' + code : 'sz' + code
  }
  const url = `/staticTool/api/qt/q=${code}`
  const response = await fetch(url, { signal })
  const buffer = await response.arrayBuffer()
  const text = new TextDecoder('gbk').decode(buffer)
  const match = text.match(/="(.+)"/)
  if (!match) throw new Error('未获取到行情数据')
  const parts = match[1].split('~')
  if (parts.length < 45) throw new Error('行情数据格式异常')

  const price = parseFloat(parts[3]) || 0
  const yesterdayClose = parseFloat(parts[4]) || 0
  const turnoverRaw = parseFloat(parts[38]) || 0
  const totalShares = parseFloat(parts[44]) || 0
  const marketCapYuan = totalShares > 0 ? (totalShares * price) : 0
  const changePct = (price && yesterdayClose)
    ? +((price - yesterdayClose) / yesterdayClose * 100).toFixed(2)
    : 0

  return {
    f3: changePct,
    f8: turnoverRaw,
    f12: code.replace(/^(sh|sz)/, ''),
    f14: parts[1] || '',
    f20: marketCapYuan, // in yuan, compatible with push2 f20
    // Extra fields for detail page hero
    _price: price,
    _yesterdayClose: yesterdayClose,
    _open: parseFloat(parts[5]) || 0,
    _high: parseFloat(parts[33]) || 0,
    _low: parseFloat(parts[34]) || 0,
    _volumeRatio: parseFloat(parts[10]) || 1,
  }
}

// ==================== 指标含义与操作建议库 ====================
export const METRIC_EXPLANATIONS = {
  ma17: { title: '通线 (MA17)', desc: '大道七线中最敏感的短期均线，代表17日平均成本，也称为操盘线。股价站上通线且通线上行，短期强势；跌破通线则短期走弱。', suggestion: '当股价放量站上通线且通子线金叉初期，可短线参与；若股价持续在通线下方运行，宜观望或止损。' },
  ma26: { title: '子线 (MA26)', desc: '大道七线的短期趋势确认线，配合通线判断金叉死叉。子线向上拐头往往预示波段行情启动。', suggestion: '子线斜率向上且股价站稳子线，持仓待涨；子线走平或向下，谨慎减仓。' },
  ma100: { title: '午线 (MA100)', desc: '中期生命线，判断中期趋势牛熊。股价在午线上方为中期多头区域，下方为中期空头。', suggestion: '中线交易者可将午线作为持仓底线，跌破午线减仓至半仓以下；站稳午线且午线上行，可持股为主。' },
  ma145: { title: '辰线 (MA145)', desc: '中长线牛熊分界线，对于长周期趋势有重要支撑/压力作用，主力机构常参考该线。', suggestion: '辰线之上且拐头向上，长线看多；若反弹至辰线遇阻回落，需注意减仓；辰线下方宜轻仓或观望。' },
  ma320: { title: '申线 (MA320)', desc: '长期趋势线，代表近一年半的市场平均成本，极端行情常提供强支撑或强阻力。', suggestion: '股价回踩申线不破且缩量，是长线布局区域；有效跌破申线则表明长期趋势转弱，应离场。' },
  ma455: { title: '卯线 (MA455)', desc: '两年均线，刻画超长周期筹码分布，大机构定仓位的重要参考。', suggestion: '卯线斜率向上且股价在其上方，坚定长期持有；当股价远离卯线过远(>30%)，注意回调风险。' },
  ma732: { title: '亥线 (MA732)', desc: '大道七线最长周期均线，约3年成本线，属终极支撑/压力带，极少被跌破。', suggestion: '触碰到亥线通常是历史性底部区域，可以分批建仓；若股价从高位跌至亥线附近，视为左侧交易机会。' },
  tongziStatus: { title: '通子状态 (金叉/死叉)', desc: '通线(MA17)与子线(MA26)的交叉关系。通子上穿子线为"金叉"，是趋势走强信号；下穿为"死叉"，趋势转弱。', suggestion: '金叉出现且配合放量，是买入或加仓信号；死叉出现时减仓回避。若是周线级别金叉，可信度更高。' },
  rsi: { title: '相对强弱指数 (RSI14)', desc: '测量股价内部强弱，超买线70，超卖线30。高于70超买，低于30超卖。', suggestion: 'RSI<30超卖区，可左侧低吸；RSI>70超买区，谨慎追高，可分批止盈。50以上为强势区，50以下弱势。' },
  macdStatus: { title: 'MACD指标 (12,26,9)', desc: '由DIFF快线、DEA慢线及柱状线组成。金叉(DIFF上穿DEA)为买入信号，死叉为卖出信号。', suggestion: '零轴上方金叉为强势主升浪信号，积极做多；零轴下方金叉为反弹，需控制仓位。顶背离时减仓，底背离时关注。' },
  volRatio: { title: '量比 (成交量比)', desc: '当前成交量与过去20日均量比值。>1.2显著放量，<0.8显著缩量。', suggestion: '量比>1.5且股价突破重要均线，主力进攻信号；量比<0.5且股价下跌，抛压枯竭，有望反弹。' },
  goldenCross: { title: '通子金叉', desc: '通线(MA17)上穿子线(MA26)，短期均线多头排列，趋势转暖初期。', suggestion: '金叉共振且价格站上通子线，建仓或加仓；注意金叉时的成交量配合，放量金叉可靠性更高。' },
  deadCross: { title: '通子死叉', desc: '通线下穿子线，短期均线空头排列，趋势转弱。', suggestion: '死叉出现应降低仓位，尤其是高位死叉。可转入防守策略，等待下一次金叉。' },
  nearGoldenCross: { title: '5日内通子金叉', desc: '最近5个交易日内出现过通子金叉信号。比当日金叉更实用，因为刚发生金叉的股票后续上涨概率更高，且避免漏掉前1-4天金叉的个股。', suggestion: '5日内金叉意味着短期趋势刚转多，是较优入场窗口。建议配合成交量确认——放量金叉更可靠，缩量金叉需谨慎。可重点关注金叉后首次回踩通线的低吸机会。' },
  priceAboveTong: { title: '股价 > 通线', desc: '收盘价位于17日均线之上，短期处于相对强势区域。', suggestion: '短线操作以通线作为止损位，股价高于通线可持股，跌破则卖出。' },
  priceAboveWu: { title: '股价 > 午线(MA100)', desc: '价格站稳100日均线，中期趋势向好。', suggestion: '中期持仓底线参考午线，线上看多、线下看空。突破午线且午线走平向上为中长线买点。' },
  priceAboveChen: { title: '股价 > 辰线(MA145)', desc: '突破中长线牛熊分界线，具备走牛潜力。', suggestion: '站稳辰线可视为牛熊转换信号，加仓布局；若假突破则及时止损。' },
  priceAboveShen: { title: '股价 > 申线(MA320)', desc: '股价位于长期趋势线之上，代表近一年半成本线支撑有效，长期趋势偏多。', suggestion: '股价站稳申线，长线趋势健康，可作为长线持仓底线。若跌破申线，长期趋势转弱需离场。回踩申线缩量不破是加仓良机。' },
  rsiOversold: { title: 'RSI超卖 (RSI<30)', desc: '市场短期超跌，空头力量过度释放。', suggestion: '谨慎左侧低吸，等待RSI重回30以上并放量确认底背离。不宜重仓抄底。' },
  rsiOverbought: { title: 'RSI超买 (RSI>70)', desc: '市场过热，短期可能回调或震荡。', suggestion: '持股者分批止盈，不追高。激进的短线可以减仓等待RSI回落至50附近再考虑。' },
  rsiNeutral: { title: 'RSI中性区 (40-60)', desc: '多空力量相对均衡，无明显超买超卖信号。此状态下RSI本身参考价值有限，需结合其他指标判断方向。', suggestion: 'RSI中性区不宜单独作为交易依据，建议结合均线趋势、MACD方向、量价变化综合判断。趋势向上时中性区可持股，趋势向下时中性区可观望。' },
  macdGolden: { title: 'MACD金叉', desc: 'DIFF线上穿DEA线，多头动能开始占据优势。', suggestion: '若金叉发生在零轴附近或上方，是趋势启动点；零轴下方金叉反弹力度较弱，做反弹需快进快出。' },
  macdAboveZero: { title: 'MACD零轴上方', desc: 'DIFF线与DEA线均位于零轴之上，表明中期趋势为多头市场。相比单纯金叉，零轴上方代表更强的趋势确认。', suggestion: 'MACD在零轴上方运行，说明中期趋势偏多，可持股为主。零轴上方金叉是强共振信号，积极做多；零轴上方死叉可能是短期回调，不必恐慌。' },
  macdDeath: { title: 'MACD死叉', desc: 'DIFF线下穿DEA线，空头动能增强。但MACD死叉的滞后性较强，出现时往往已下跌一段，参考价值有限。', suggestion: '高位MACD死叉需重视，可能开启下跌趋势；低位MACD死叉可能已接近尾声，反而是关注底部的时机。单独使用死叉信号容易卖在低点，建议结合均线和量价综合判断。' },
  wuChenGolden: { title: '午辰金叉 (MA100上穿MA145)', desc: '午线(MA100)上穿辰线(MA145)，是中长线趋势转强的重要信号，比通子金叉更稳定，确认的中期趋势更可靠。', suggestion: '午辰金叉出现，中期趋势由弱转强，是中线建仓信号。若同时伴随放量突破，可靠性极高。可中线持股，以午线作为止损参考。' },
  volumeSurge: { title: '成交量放大(>20日均量)', desc: '当日成交量超过20日均量的20%以上，代表明显放量。', suggestion: '低位放量突破重要均线是启动信号；高位放量滞涨是危险信号；上涨初期温和放量更健康。' },
  shrinkPullback: { title: '缩量回调', desc: '股价短期下跌但成交量明显萎缩(量比<0.8)，说明抛压不大，多为洗盘而非出货，是健康回调的特征。', suggestion: '在多头趋势中缩量回调是较好的低吸时机，可在重要均线(通线/午线)附近分批买入。若后续放量上涨则确认洗盘结束。注意：空头趋势中缩量下跌不代表见底。' },
  multiHair: { title: '多头排列 (MA17>MA26>MA100)', desc: '短、中、长均线依次向上发散，标准多头趋势。', suggestion: '多头排列形成后，每次回踩重要均线都是买点。持仓享受主升浪，未持仓者可待缩量回调均线介入。' },
  bearishAlignment: { title: '空头排列 (MA17<MA26<MA100)', desc: '短、中、长均线依次向下发散，标准空头趋势。此指标参考价值有限——空头排列只确认了已有跌势，但无法提示底部，实际操作中应关注何时反转而非确认弱势。', suggestion: '空头排列的股票原则上不参与，等待均线走平或金叉信号再考虑。若必须操作，仅可短线反弹思路，严格止损。' },
  priceBelowHai: { title: '股价 < 亥线(MA732)', desc: '股价跌破3年成本线，属于极端弱势。这种情况极为罕见，出现时往往已处于历史性底部附近，但"便宜"不等于"见底"，参考价值有限。', suggestion: '股价跌破亥线属于极弱势，不宜盲目抄底。若要参与，需等待企稳信号（如放量长阳、MACD底背离）确认后再分批介入，严格控制在极轻仓位。' },
  highAmplitude: { title: '高振幅(>5%)', desc: '当日振幅(最高-最低)/昨收>5%，说明多空分歧大、波动剧烈。高振幅本身不提供方向性信号，参考价值有限，需结合收盘方向判断。', suggestion: '高振幅收阳且放量，可能启动新行情；高振幅收阴且放量，警惕主力出货。短线交易者可利用高振幅做T+0，但风险较大。中长线投资者可忽略此指标。' },
  changePct: { title: '涨跌幅(%)', desc: '当日股价涨跌百分比，最基础的市场信号。红涨绿跌是A股惯例。', suggestion: '涨跌幅反映当日市场情绪，但单日涨跌不足以判断趋势。连续3日以上的同方向涨跌更有参考意义。' },
  turnover: { title: '换手率(%)', desc: '当日成交量占流通股本的比例，反映交易活跃度。>5%活跃，>10%高度活跃，<1%低迷。', suggestion: '低位高换手率+上涨=资金进场信号；高位高换手率+滞涨=出货嫌疑。低换手率的股票流动性差，大资金进出不便。' },
  totalMv: { title: '总市值(亿)', desc: '公司总市值，反映公司规模。<100亿小盘股，100-500亿中盘，>500亿大盘股，>2000亿超大盘。', suggestion: '小盘股弹性大但风险高，适合短线；大盘股稳健但涨幅慢，适合中长线。根据自身风险偏好选择。' },
  distTong: { title: '距通线偏离(%)', desc: '(当前价-通线MA17)/通线*100%，正值表示股价在通线上方，负值在下方。偏离越大，短期乖离越严重。', suggestion: '偏离>5%以上短期超买，可能回调向通线靠拢；偏离<-5%短期超卖，可能反弹。偏离接近0%说明股价贴近通线，方向选择在即。' },
  pct5d: { title: '5日涨跌幅(%)', desc: '最近5个交易日累计涨跌幅，反映短期动能方向和强度。', suggestion: '5日涨跌>10%短期强势，可追涨但需设止损；5日跌>10%短期弱势，不宜接飞刀。5日涨跌在±3%以内属震荡，等待方向突破。' },
  pct20d: { title: '20日涨跌幅(%)', desc: '最近20个交易日(约1个月)累计涨跌幅，反映中期趋势动能。', suggestion: '20日涨跌>20%中期强势，可中线持有；20日跌>15%中期弱势，回避。结合均线趋势判断是否可持续。' }
}

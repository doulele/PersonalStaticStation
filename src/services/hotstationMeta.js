/**
 * 信息工作台 · 前端平台能力元数据
 * 与后端 linkParser 保持一致
 */
export const PLATFORM_CAPABILITY = {
  bilibili: { name: 'B站', level: 'full', desc: '深度解析：标题/简介/评论Top10/弹幕高频词', icon: '🔵' },
  youtube: { name: 'YouTube', level: 'full', desc: '深度解析：标题/简介/评论Top10', icon: '🔵' },
  zhihu: { name: '知乎', level: 'full', desc: '深度解析：标题/正文/高赞回答Top5', icon: '🔵' },
  weixin: { name: '公众号', level: 'partial', desc: '正文解析（评论区暂不支持）', icon: '🟢' },
  weibo: { name: '微博', level: 'partial', desc: '仅正文提取', icon: '🟡' },
  douyin: { name: '抖音', level: 'basic', desc: '仅标题/简介', icon: '⚪' },
  xiaohongshu: { name: '小红书', level: 'basic', desc: '仅标题/简介', icon: '⚪' },
  generic: { name: '网页', level: 'partial', desc: '通用正文提取', icon: '🟢' }
}

/** 识别平台 */
export function detectPlatform(url = '') {
  const u = String(url || '').toLowerCase()
  if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('zhihu.com')) return 'zhihu'
  if (u.includes('weixin.qq.com') || u.includes('mp.weixin')) return 'weixin'
  if (u.includes('weibo.com') || u.includes('weibo.cn')) return 'weibo'
  if (u.includes('douyin.com') || u.includes('iesdouyin.com')) return 'douyin'
  if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return 'xiaohongshu'
  return 'generic'
}

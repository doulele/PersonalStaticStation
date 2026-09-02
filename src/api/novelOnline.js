/**
 * 在线阅读（novelOnline）API
 */
import { get } from './request'

/**
 * 聚合搜索（微信读书 + 维基文库）
 * @param {string} kw 关键词
 * @returns {Promise<{kw:string, groups:{weread:[], wikisource:[]}, items:[]}>}
 */
export function searchBooks(kw) {
  return get('/novel/search', { kw })
}

/** 公版经典书单 */
export function getClassics() {
  return get('/novel/classics')
}

/** 维基文库书籍详情（目录） */
export function getWikisourceBook(title) {
  return get('/novel/wikisource/book', { title })
}

/** 维基文库章节正文 */
export function getWikisourceChapter(page) {
  return get('/novel/wikisource/chapter', { page })
}

export default { searchBooks, getClassics, getWikisourceBook, getWikisourceChapter }

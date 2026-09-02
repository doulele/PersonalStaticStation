/**
 * IndexedDB 封装：存储导入的本地书籍全文（EPUB/TXT）
 * 小数据（书架/进度/笔记）仍走 localStorage，全文走这里避免 5MB 上限
 */
const DB_NAME = 'novel_db'
const STORE = 'books'
const DB_VERSION = 1

let _db = null

function open() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db)
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => {
      _db = req.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error || new Error('IndexedDB 打开失败'))
  })
}

function storeTx(mode) {
  return open().then((db) => db.transaction(STORE, mode).objectStore(STORE))
}

/** 保存本地书（含全文） */
export function putLocalBook(book, chapters) {
  return new Promise((resolve, reject) => {
    storeTx('readwrite').then(
      (s) => {
        const req = s.put({ key: book.key, book, chapters })
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      },
      reject
    )
  })
}

/** 读取本地书（含全文） */
export function getLocalBook(key) {
  return new Promise((resolve, reject) => {
    storeTx('readonly').then(
      (s) => {
        const req = s.get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => reject(req.error)
      },
      reject
    )
  })
}

/** 删除本地书 */
export function deleteLocalBook(key) {
  return new Promise((resolve, reject) => {
    storeTx('readwrite').then(
      (s) => {
        const req = s.delete(key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      },
      reject
    )
  })
}

export default { putLocalBook, getLocalBook, deleteLocalBook }

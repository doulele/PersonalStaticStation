/**
 * 全局认证守卫 composable
 * 用于在点击需要登录的功能时弹出提示对话框
 */
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

/**
 * 检查是否需要认证，未登录则弹出全局提示框
 * @param {string} redirectPath - 登录后重定向的路径（可选，默认为当前触发页面路径）
 * @returns {Promise<boolean>} - true: 已登录或用户同意前往登录; false: 用户取消
 */
export function useAuthGuard() {
  const router = useRouter()

  /**
   * 要求登录。如果未登录，弹出提示框。
   * @param {object} options
   * @param {string} options.redirectPath - 登录后要跳转的路径
   * @param {string} options.title - 弹框标题，默认"提示"
   * @param {string} options.message - 弹框内容，默认"当前功能需要登录后才能使用"
   * @param {string} options.confirmText - 确定按钮文本，默认"前往登录"
   * @param {string} options.cancelText - 取消按钮文本，默认"取消"
   * @returns {Promise<boolean>} - 用户是否前往登录
   */
  async function requireAuth(options = {}) {
    const {
      redirectPath = router.currentRoute.value.fullPath,
      title = '提示',
      message = '当前功能需要登录后才能使用',
      confirmText = '前往登录',
      cancelText = '取消'
    } = options

    // 检查是否已登录
    const token = localStorage.getItem('auth_token')
    if (token) {
      return true // 已登录，直接放行
    }

    // 未登录，弹出全局提示框
    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        type: 'warning',
        center: true
      })
      // 用户点击确定 → 跳转登录页
      router.push({ path: '/login', query: { redirect: redirectPath } })
      return true
    } catch {
      // 用户点击取消 → 不做任何操作
      return false
    }
  }

  return { requireAuth }
}

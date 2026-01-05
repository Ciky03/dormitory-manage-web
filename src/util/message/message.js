import { ElMessage } from 'element-plus'

export const showSuccess = (message) => {
  ElMessage.success({ message, customClass: 'app-message' })
}

export const showError = (error, fallback = '操作失败') => {
  const message = error?.message || fallback
  ElMessage.error({ message, customClass: 'app-message' })
}

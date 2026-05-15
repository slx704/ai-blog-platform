import axios from 'axios'
import { ElMessage } from 'element-plus'
import { isDeveloper } from '../api/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (isDeveloper()) {
    console.log('[DEV Request]', config.method?.toUpperCase(), config.url, config.data || '')
  }
  return config
}, error => {
  return Promise.reject(error)
})

api.interceptors.response.use(
  response => {
    if (isDeveloper()) {
      console.log('[DEV Response]', response.config.url, response.data)
    }
    return response.data
  },
  error => {
    if (isDeveloper()) {
      console.error('[DEV Error]', error.config?.url, error.message, error.response?.data)
    }

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          ElMessage.warning('登录已过期，请重新登录')
          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.href = '/login'
            }, 1500)
          }
          break
        case 403:
          ElMessage.error('没有权限操作')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器开小差了，请稍后重试')
          break
        default:
          if (data && data.message) {
            ElMessage.error(data.message)
          } else {
            ElMessage.error('请求失败，请稍后重试')
          }
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default api

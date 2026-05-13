import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 403:
          console.error('没有权限操作')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器开小差了，请稍后重试')
          break
        default:
          if (data && data.message) {
            console.error(data.message)
          } else {
            console.error('请求失败，请稍后重试')
          }
      }
    } else if (error.request) {
      console.error('网络连接失败，请检查网络')
    } else {
      console.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default api
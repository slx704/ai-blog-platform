<template>
  <div class="login-page">
    <div class="container">
      <div class="login-box">
        <div class="login-header">
          <h1>AI博客平台</h1>
          <p>{{ isLoginMode ? '欢迎回来' : '创建新账号' }}</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username"
              v-model="form.username"
              type="text" 
              placeholder="请输入用户名"
              class="form-input"
            />
            <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              id="password"
              v-model="form.password"
              type="password" 
              placeholder="请输入密码"
              class="form-input"
            />
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>
          
          <div v-if="!isLoginMode" class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input 
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password" 
              placeholder="请再次输入密码"
              class="form-input"
            />
            <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
          </div>
          
          <div v-if="error" class="error-msg">{{ error }}</div>
          
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '处理中...' : (isLoginMode ? '登录' : '注册') }}
          </button>
        </form>
        
        <div class="switch-mode">
          <span>{{ isLoginMode ? '还没有账号？' : '已有账号？' }}</span>
          <button @click="toggleMode" class="switch-btn">{{ isLoginMode ? '立即注册' : '立即登录' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../api/auth'

const router = useRouter()

const isLoginMode = ref(true)
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validate = () => {
  let valid = true
  
  if (!form.username.trim()) {
    errors.username = '用户名不能为空'
    valid = false
  } else {
    errors.username = ''
  }
  
  if (!form.password) {
    errors.password = '密码不能为空'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = '密码至少需要6位'
    valid = false
  } else {
    errors.password = ''
  }
  
  if (!isLoginMode.value) {
    if (!form.confirmPassword) {
      errors.confirmPassword = '请确认密码'
      valid = false
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
      valid = false
    } else {
      errors.confirmPassword = ''
    }
  }
  
  return valid
}

const handleSubmit = async () => {
  if (!validate()) return
  
  loading.value = true
  error.value = ''
  
  try {
    let response
    if (isLoginMode.value) {
      response = await login(form.username, form.password)
    } else {
      response = await register(form.username, form.password)
    }
    
    if (response.success) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      router.push('/')
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || '操作失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  error.value = ''
  form.username = ''
  form.password = ''
  form.confirmPassword = ''
  errors.username = ''
  errors.password = ''
  errors.confirmPassword = ''
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  max-width: 400px;
  width: 100%;
}

.login-box {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #667eea;
}

.field-error {
  font-size: 12px;
  color: #d32f2f;
}

.error-msg {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 13px;
}

.submit-btn {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-mode {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.switch-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 500;
}

.switch-btn:hover {
  text-decoration: underline;
}
</style>
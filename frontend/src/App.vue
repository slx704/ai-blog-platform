<template>
  <div id="app">
    <nav class="navbar">
      <div class="container">
        <router-link to="/" class="logo">
          <span class="logo-icon">🤖</span>
          <span class="logo-text">AI博客平台</span>
        </router-link>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/ai-tools" class="nav-link" v-if="checkLogin()">AI工具</router-link>
          <router-link to="/code-review" class="nav-link" v-if="checkLogin()">代码区</router-link>
          
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索文章..." 
              @keyup.enter="handleSearch"
              class="search-input"
            />
            <button @click="handleSearch" class="search-btn">搜索</button>
          </div>
          
          <button @click="toggleTheme" class="theme-btn" :title="currentTheme === 'light' ? '切换深色模式' : '切换浅色模式'">
            {{ currentTheme === 'light' ? '🌙' : '☀️' }}
          </button>
          
          <div class="auth-links" v-if="checkLogin()">
            <router-link to="/edit" class="nav-link publish-btn">写文章</router-link>
            <router-link to="/profile" class="nav-link">个人中心</router-link>
            <button @click="handleLogout" class="logout-btn">退出</button>
          </div>
          <router-link to="/login" class="nav-link" v-else>登录</router-link>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view @login-success="handleLoginSuccess" />
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>AI博客平台 © 2026</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated, logout } from './api/auth'
import { initTheme, toggleTheme as toggle, getTheme } from './utils/theme'

const router = useRouter()
const searchQuery = ref('')
const loginStatus = ref(isAuthenticated())
const currentTheme = ref<any>(getTheme())

const checkLogin = () => {
  loginStatus.value = isAuthenticated()
  return loginStatus.value
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/?q=${encodeURIComponent(searchQuery.value.trim())}`)
    searchQuery.value = ''
  }
}

const handleLogout = () => {
  logout()
  loginStatus.value = false
  router.push('/')
}

const handleLoginSuccess = () => {
  loginStatus.value = true
}

const toggleTheme = () => {
  currentTheme.value = toggle()
}

initTheme()
</script>

<style>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --bg-card: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --shadow: rgba(0, 0, 0, 0.1);
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --navbar-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:root.dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  --text-primary: #e4e4e4;
  --text-secondary: #b8b8b8;
  --text-muted: #888888;
  --border-color: #2a2a4a;
  --shadow: rgba(0, 0, 0, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background-color 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: var(--navbar-bg);
  padding: 12px 0;
  box-shadow: 0 2px 10px var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: white;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 8px 15px;
  border-radius: 20px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

.search-box {
  display: flex;
  gap: 5px;
}

.search-input {
  padding: 6px 12px;
  border: none;
  border-radius: 15px;
  font-size: 14px;
  width: 150px;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.search-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.search-btn:hover {
  background: white;
}

.theme-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.publish-btn {
  background: #28a745;
  color: white !important;
}

.publish-btn:hover {
  background: #218838 !important;
}

.logout-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  padding-bottom: 60px;
}

.footer {
  background: var(--bg-card);
  color: var(--text-muted);
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
  border-top: 1px solid var(--border-color);
}

.footer .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .nav-links {
    gap: 8px;
  }
  
  .search-box {
    display: none;
  }
  
  .logo-text {
    font-size: 16px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 14px;
  }
}
</style>

<template>
  <div class="profile">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else class="profile-content">
        <div class="profile-header">
          <div class="avatar-section">
            <div class="avatar">
              <img v-if="profile.avatar" :src="profile.avatar" alt="头像" class="avatar-img" />
              <span v-else class="avatar-icon">👤</span>
            </div>
            <div class="user-info">
              <h2 class="username">{{ profile.nickname || profile.username }}</h2>
              <p class="signature">{{ profile.signature || '暂无签名' }}</p>
              <p class="bio">{{ profile.bio || '暂无个性签名' }}</p>
              <div class="user-stats">
                <span class="stat-item">🎂 {{ profile.age || '未知' }} 岁</span>
                <span class="stat-item">📅 {{ formatDate(profile.created_at) }} 加入</span>
                <span class="stat-item">💾 {{ profile.total_tokens.toLocaleString() }} 消耗token</span>
              </div>
            </div>
          </div>
          <div class="header-buttons">
            <button @click="openEditModal" class="edit-btn">编辑资料</button>
            <button @click="openPasswordModal" class="password-btn">修改密码</button>
          </div>
        </div>
        
        <div class="profile-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.icon }} {{ tab.name }}
          </button>
        </div>
        
        <div class="tab-content">
          <div v-if="activeTab === 'articles'" class="articles-tab">
            <div v-if="userArticles.length === 0" class="empty-state">
              <p>暂无文章</p>
            </div>
            <div v-else class="article-list">
              <article v-for="article in userArticles" :key="article.id" class="article-item">
                <router-link :to="`/article/${article.id}`" class="article-link">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="date">{{ formatDate(article.created_at) }}</span>
                    <span class="views">{{ article.view_count }} 阅读</span>
                    <span class="likes">{{ article.like_count }} 点赞</span>
                  </div>
                </router-link>
                <button @click="handleDeleteArticle(article.id)" class="delete-btn">删除</button>
              </article>
            </div>
          </div>
          
          <div v-if="activeTab === 'likes'" class="likes-tab">
            <div v-if="likedArticles.length === 0" class="empty-state">
              <p>暂无点赞的文章</p>
            </div>
            <div v-else class="article-list">
              <article v-for="article in likedArticles" :key="article.id" class="article-item">
                <router-link :to="`/article/${article.id}`" class="article-link">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="author">{{ article.username }}</span>
                    <span class="date">{{ formatDate(article.created_at) }}</span>
                    <span class="views">{{ article.view_count }} 阅读</span>
                  </div>
                </router-link>
              </article>
            </div>
          </div>
          
          <div v-if="activeTab === 'history'" class="history-tab">
            <div v-if="historyRecords.length === 0" class="empty-state">
              <p>暂无使用记录</p>
            </div>
            <div v-else class="history-list">
              <div v-for="record in historyRecords" :key="record.id" class="history-item">
                <div class="history-header">
                  <span class="tool-type">{{ getToolTypeName(record.tool_type) }}</span>
                  <span class="date">{{ formatDate(record.created_at) }}</span>
                </div>
                <div class="history-content">
                  <p class="input-text">{{ truncate(record.input_text, 50) }}</p>
                  <p class="output-text">{{ truncate(record.output_text, 100) }}</p>
                </div>
                <div class="tokens-used">消耗 {{ record.tokens_used }} token</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>编辑资料</h3>
            <button @click="showEditModal = false" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group avatar-upload">
              <label>头像</label>
              <div class="avatar-preview">
                <img v-if="editForm.avatar || profile.avatar" :src="editForm.avatar || profile.avatar" alt="头像预览" />
                <span v-else class="no-avatar">👤</span>
              </div>
              <input id="avatar-upload" type="file" accept="image/*" @change="handleAvatarUpload" class="avatar-input" />
              <label for="avatar-upload" class="upload-btn">选择图片</label>
              <button v-if="editForm.avatar || profile.avatar" @click="removeAvatar" class="remove-avatar-btn">移除头像</button>
            </div>
            <div class="form-group">
              <label>昵称</label>
              <input v-model="editForm.nickname" type="text" placeholder="输入昵称" class="form-input" maxlength="36" />
            </div>
            <div class="form-group">
              <label>个性签名</label>
              <textarea 
                v-model="editForm.bio" 
                placeholder="输入个性签名" 
                class="form-input bio-input" 
                rows="1"
                @input="autoResizeTextarea"
                maxlength="80"
              ></textarea>
            </div>
            <div class="form-group">
              <label>性别</label>
              <select v-model="editForm.gender" class="form-input">
                <option value="">请选择性别</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label>生日</label>
              <div class="birthday-selector">
                <select v-model="editForm.birthMonth" class="form-input month-select">
                  <option value="">选择月份</option>
                  <option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
                </select>
                <select v-model="editForm.birthDay" class="form-input day-select">
                  <option value="">选择日期</option>
                  <option v-for="day in days" :key="day" :value="day">{{ day }}日</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>国家</label>
                <input v-model="editForm.country" type="text" placeholder="请选择" class="form-input" />
              </div>
              <div class="form-group">
                <label>省份</label>
                <input v-model="editForm.province" type="text" placeholder="请选择" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label>地区</label>
              <input v-model="editForm.city" type="text" placeholder="请选择" class="form-input" />
            </div>
            <div class="form-group">
              <label>年龄</label>
              <input v-model.number="editForm.age" type="number" placeholder="输入年龄" class="form-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showEditModal = false" class="cancel-btn">取消</button>
            <button @click="handleUpdateProfile" class="confirm-btn">保存</button>
          </div>
        </div>
      </div>

      <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3>修改密码</h3>
            <button @click="showPasswordModal = false" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>原密码</label>
              <input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" class="form-input" />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" class="form-input" @input="checkPasswordStrength" />
              <div class="password-strength">
                <div class="strength-bar">
                  <div class="strength-fill" :class="passwordStrengthClass" :style="{ width: passwordStrengthWidth }"></div>
                </div>
                <span class="strength-text" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" class="form-input" />
              <span v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword" class="field-error">两次输入的密码不一致</span>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showPasswordModal = false" class="cancel-btn">取消</button>
            <button @click="handleUpdatePassword" class="confirm-btn" :disabled="!canSubmitPassword">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getProfile, updateProfile, updatePassword, getUserArticles, getUserLikes } from '../api/users'
import { deleteArticle } from '../api/articles'
import { devError } from '../utils/devLogger'

interface UserProfile {
  id: number
  username: string
  avatar?: string
  signature?: string
  bio?: string
  nickname?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  country?: string
  province?: string
  city?: string
  age?: number
  total_tokens: number
  created_at: string
}

interface Article {
  id: number
  title: string
  view_count: number
  like_count: number
  created_at: string
  username?: string
}

interface HistoryRecord {
  id: number
  tool_type: string
  input_text: string
  output_text: string
  tokens_used: number
  created_at: string
}

const router = useRouter()

const profile = ref<UserProfile>({
  id: 0,
  username: '',
  signature: '',
  bio: '',
  nickname: '',
  gender: undefined,
  birthday: '',
  country: '',
  province: '',
  city: '',
  age: undefined,
  total_tokens: 0,
  created_at: new Date().toISOString()
})
const userArticles = ref<Article[]>([])
const likedArticles = ref<Article[]>([])
const historyRecords = ref<HistoryRecord[]>([])
const loading = ref(false)
const activeTab = ref('articles')
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const passwordStrength = ref(0)

const editForm = reactive({
  avatar: '',
  signature: '',
  bio: '',
  nickname: '',
  gender: '',
  birthMonth: '',
  birthDay: '',
  country: '',
  province: '',
  city: '',
  age: 0
})

const months = [
  { value: '01', label: '1月' },
  { value: '02', label: '2月' },
  { value: '03', label: '3月' },
  { value: '04', label: '4月' },
  { value: '05', label: '5月' },
  { value: '06', label: '6月' },
  { value: '07', label: '7月' },
  { value: '08', label: '8月' },
  { value: '09', label: '9月' },
  { value: '10', label: '10月' },
  { value: '11', label: '11月' },
  { value: '12', label: '12月' }
]

const days = Array.from({ length: 31 }, (_, i) => i + 1)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value === 0) return ''
  if (passwordStrength.value === 1) return 'weak'
  if (passwordStrength.value === 2) return 'medium'
  return 'strong'
})

const passwordStrengthWidth = computed(() => {
  return passwordStrength.value === 0 ? '0%' : `${passwordStrength.value * 33.33}%`
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value === 0) return ''
  if (passwordStrength.value === 1) return '弱'
  if (passwordStrength.value === 2) return '中'
  return '强'
})

const canSubmitPassword = computed(() => {
  return passwordForm.oldPassword &&
         passwordForm.newPassword &&
         passwordForm.newPassword.length >= 6 &&
         passwordForm.newPassword === passwordForm.confirmPassword
})

const tabs = [
  { id: 'articles', name: '我的文章', icon: '📝' },
  { id: 'likes', name: '我的点赞', icon: '❤️' },
  { id: 'history', name: 'AI使用记录', icon: '📊' }
]

const toolTypeNames: Record<string, string> = {
  polish: '✨ 文案润色',
  code_comment: '💻 代码注释',
  translate: '🌍 翻译'
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '未知'
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const truncate = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getToolTypeName = (type: string) => {
  return toolTypeNames[type] || type
}

const fetchProfile = async () => {
  loading.value = true
  try {
    profile.value = await getProfile()
    await fetchUserArticles()
    await fetchLikedArticles()
  } catch (err) {
    devError('获取资料失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchUserArticles = async () => {
  try {
    userArticles.value = await getUserArticles(profile.value.id)
  } catch (err) {
    devError('获取文章失败:', err)
  }
}

const fetchLikedArticles = async () => {
  try {
    likedArticles.value = await getUserLikes()
  } catch (err) {
    devError('获取点赞失败:', err)
  }
}

const handleDeleteArticle = async (articleId: number) => {
  if (!confirm('确定删除这篇文章吗？')) return
  try {
    await deleteArticle(articleId)
    await fetchUserArticles()
  } catch (err) {
    devError('删除文章失败:', err)
  }
}

const openEditModal = () => {
  editForm.avatar = ''
  editForm.signature = profile.value.signature || ''
  editForm.bio = profile.value.bio || ''
  editForm.nickname = profile.value.nickname || ''
  editForm.gender = profile.value.gender || ''
  if (profile.value.birthday) {
    const dateStr = profile.value.birthday.split('T')[0]
    const parts = dateStr.split('-')
    editForm.birthMonth = parts[1] || ''
    editForm.birthDay = parts[2] ? parts[2].substring(0, 2) : ''
  } else {
    editForm.birthMonth = ''
    editForm.birthDay = ''
  }
  editForm.country = profile.value.country || ''
  editForm.province = profile.value.province || ''
  editForm.city = profile.value.city || ''
  editForm.age = profile.value.age || 0
  showEditModal.value = true
}

const openPasswordModal = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordStrength.value = 0
  showPasswordModal.value = true
}

const handleAvatarUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeAvatar = () => {
  editForm.avatar = ''
}

const handleUpdateProfile = async () => {
  try {
    const data: Record<string, any> = {}
    if (editForm.avatar) data.avatar = editForm.avatar
    if (editForm.signature) data.signature = editForm.signature
    if (editForm.bio) data.bio = editForm.bio
    if (editForm.nickname) data.nickname = editForm.nickname
    if (editForm.gender) data.gender = editForm.gender
    if (editForm.birthMonth && editForm.birthDay) {
      data.birthday = `0000-${editForm.birthMonth}-${String(editForm.birthDay).padStart(2, '0')}`
    }
    if (editForm.country) data.country = editForm.country
    if (editForm.province) data.province = editForm.province
    if (editForm.city) data.city = editForm.city
    if (editForm.age > 0) data.age = editForm.age
      
    await updateProfile(data)
    await fetchProfile()
    showEditModal.value = false
    editForm.avatar = ''
    ElMessage.success('资料更新成功')
  } catch (err) {
    devError('更新资料失败:', err)
    ElMessage.error('更新资料失败')
  }
}

const checkPasswordStrength = () => {
  const password = passwordForm.newPassword
  if (!password) {
    passwordStrength.value = 0
    return
  }
  
  let strength = 0
  
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++
  
  if (strength <= 2) passwordStrength.value = 1
  else if (strength <= 3) passwordStrength.value = 2
  else passwordStrength.value = 3
}

const handleUpdatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    showPasswordModal.value = false
    ElMessage.success('密码修改成功')
  } catch (err: any) {
    devError('修改密码失败:', err)
    ElMessage.error(err.response?.data?.message || '修改密码失败')
  }
}

const autoResizeTextarea = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 150) + 'px'
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 30px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 60px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-content {
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow);
  overflow: hidden;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 30px;
  border-bottom: 1px solid var(--border-color);
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.avatar-section {
  display: flex;
  gap: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 48px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h2 {
  font-size: 24px;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.user-info .signature {
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.user-info .bio {
  color: var(--text-muted);
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.user-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: var(--text-muted);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-btn, .password-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.password-btn {
  background: #f0f0f0;
  color: #666;
}

.password-btn:hover {
  background: #e0e0e0;
}

.edit-btn:hover {
  background: #5568d3;
}

.profile-tabs {
  display: flex;
  gap: 20px;
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s;
  color: var(--text-secondary);
}

.tab-btn:hover {
  background: var(--bg-secondary);
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

.tab-content {
  padding: 30px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.article-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.article-title {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--text-muted);
}

.delete-btn {
  padding: 8px 16px;
  background: #fff0f0;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.tool-type {
  font-weight: 600;
  color: #667eea;
}

.history-content {
  margin-bottom: 10px;
}

.input-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 5px 0;
  font-style: italic;
}

.output-text {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

.tokens-used {
  font-size: 12px;
  color: var(--text-muted);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.birthday-selector {
  display: flex;
  gap: 10px;
}

.birthday-selector .month-select,
.birthday-selector .day-select {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-input.bio-input {
  resize: none;
  overflow: hidden;
  min-height: 40px;
  line-height: 1.5;
}

.field-error {
  font-size: 12px;
  color: #d32f2f;
  margin-top: 4px;
  display: block;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar {
  font-size: 48px;
}

.avatar-input {
  display: none;
}

.upload-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 10px;
}

.remove-avatar-btn {
  padding: 8px 16px;
  background: #fff0f0;
  color: #d32f2f;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
}

.cancel-btn {
  padding: 10px 20px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.confirm-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background 0.3s;
}

.strength-fill.weak {
  background: #d32f2f;
}

.strength-fill.medium {
  background: #ffa000;
}

.strength-fill.strong {
  background: #4caf50;
}

.strength-text {
  font-size: 12px;
  min-width: 20px;
}

.strength-text.weak {
  color: #d32f2f;
}

.strength-text.medium {
  color: #ffa000;
}

.strength-text.strong {
  color: #4caf50;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .header-buttons {
    width: 100%;
  }
  
  .edit-btn, .password-btn {
    flex: 1;
  }
  
  .profile-tabs {
    gap: 10px;
    padding: 15px 20px;
  }
  
  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .article-item {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
